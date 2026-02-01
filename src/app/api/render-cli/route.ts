import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { createServer } from 'http';
import { access, readFile, readdir, stat, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { basename, dirname, extname, isAbsolute, join } from 'path';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 300;

const renderRequestSchema = z.object({
  compositionId: z.string(),
  outputPath: z.string().optional(),
  inputProps: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    badgeText: z.string().optional(),
    coverImageDataUrl: z.string().optional(),
    coverVideoDataUrl: z.string().optional(),
    logoImageDataUrl: z.string().optional(),
    imageArray: z.array(z.string()).optional(),
    imageSequence: z
      .array(
        z.object({
          src: z.string(),
          durationInFrames: z.number().optional(),
          effect: z.enum(["none", "zoom-in", "zoom-out"]).optional(),
        }),
      )
      .optional(),
    imageEffect: z.enum(["none", "zoom-in", "zoom-out"]).optional(),
    transitionEffect: z.enum(["none", "fade"]).optional(),
    imageDurationInFrames: z.number().optional(),
    subtitles: z.array(z.string()).optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    accentColor: z.string().optional(),
    titleFontSize: z.number().optional(),
    subtitleFontSize: z.number().optional(),
    titleDisplayFrames: z.number().optional(),
    captionsFontSize: z.number().optional(),
    captionsFontFamily: z.string().optional(),
    durationInFrames: z.number().optional(),
    coverMediaType: z.enum(["image", "video", "mixed"]).optional(),
    audioDataUrl: z.string().optional(),
    mediaFit: z.enum(["cover", "contain"]).optional(),
    mediaPosition: z.enum(["center", "top", "bottom", "left", "right"]).optional(),
    layout: z.enum(["center", "left", "image-top", "full-screen"]).optional(),
    showRings: z.boolean().optional(),
  }),
});

const resolveBrowserExecutable = () => {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];

  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    candidates.unshift(`${localAppData}\\Google\\Chrome\\Application\\chrome.exe`);
  }

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
};

const getFileExtension = (mime: string) => {
  const normalized = mime.toLowerCase();
  if (normalized === 'image/png') return 'png';
  if (normalized === 'image/jpeg') return 'jpg';
  if (normalized === 'image/webp') return 'webp';
  if (normalized === 'image/gif') return 'gif';
  if (normalized === 'video/mp4') return 'mp4';
  if (normalized === 'video/webm') return 'webm';
  if (normalized === 'audio/mpeg') return 'mp3';
  if (normalized === 'audio/mp4') return 'm4a';
  if (normalized === 'audio/wav') return 'wav';
  if (normalized === 'audio/webm') return 'webm';
  if (normalized === 'audio/ogg') return 'ogg';
  if (normalized === 'audio/aac') return 'aac';
  return 'bin';
};

const writeDataUrlToTempFile = async (
  dataUrl: string,
  prefix: string,
  tmpDir: string,
  baseUrl: string,
  fileMap: Map<string, { path: string; mime: string }>,
) => {
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return { value: dataUrl, filePath: undefined };
  }
  if (!dataUrl.startsWith('data:')) {
    return { value: dataUrl, filePath: undefined };
  }
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return { value: dataUrl, filePath: undefined };
  }
  const [, mime, base64] = match;
  const ext = getFileExtension(mime);
  const fileName = `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const filePath = join(tmpDir, fileName);
  const buffer = Buffer.from(base64, 'base64');
  await writeFile(filePath, new Uint8Array(buffer));
  fileMap.set(fileName, { path: filePath, mime });
  return { value: `${baseUrl}/${fileName}`, filePath };
};

const safeUnlink = async (filePath?: string) => {
  if (!filePath) {
    return;
  }
  try {
    await unlink(filePath);
  } catch {
    return;
  }
};

const waitForFile = async (filePath: string, timeoutMs: number) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await access(filePath);
      return true;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  return false;
};

const videoExtensions = ['.mp4', '.webm', '.mov', '.mkv'];

const getSafeTitle = (title?: string) => {
  const resolved = title?.trim() ? title.trim() : 'untitled';
  return resolved.replace(/[^a-zA-Z0-9]/g, '_');
};

const resolveRequestedOutputPath = (
  outputPath: string | undefined,
  tmpDir: string,
  title?: string,
) => {
  const fallback = join(tmpDir, `video-${Date.now()}.mp4`);
  const trimmed = outputPath?.trim();
  if (!trimmed) {
    return fallback;
  }
  const resolved = isAbsolute(trimmed) ? trimmed : join(process.cwd(), trimmed);
  const ext = extname(resolved).toLowerCase();
  if (!ext) {
    if (!existsSync(resolved)) {
      throw new Error('Output directory does not exist.');
    }
    return join(resolved, `${getSafeTitle(title)}-${Date.now()}.mp4`);
  }
  const outputDir = dirname(resolved);
  if (!existsSync(outputDir)) {
    throw new Error('Output directory does not exist.');
  }
  if (videoExtensions.includes(ext)) {
    return resolved;
  }
  return `${resolved}.mp4`;
};

const extractOutputFileFromLogs = (stdoutTail: string, stderrTail: string) => {
  const combined = `${stdoutTail}\n${stderrTail}`;
  const candidates: string[] = [];
  const extensionPattern = '(mp4|webm|mov|mkv)';
  const patterns = [
    new RegExp(`file:\\/\\/\\/([A-Za-z]:\\/[^"\\s]+\\.${extensionPattern})`, 'gi'),
    new RegExp(`"([A-Za-z]:\\\\[^"]+?\\.${extensionPattern})"`, 'gi'),
    new RegExp(`"([A-Za-z]:\\/[^"]+?\\.${extensionPattern})"`, 'gi'),
    new RegExp(`([A-Za-z]:\\\\[^\\s]+\\.${extensionPattern})`, 'gi'),
    new RegExp(`([A-Za-z]:\\/[^\\s]+\\.${extensionPattern})`, 'gi'),
  ];
  for (const pattern of patterns) {
    let match = pattern.exec(combined);
    while (match) {
      const value = match[1];
      if (value) {
        candidates.push(value);
      }
      match = pattern.exec(combined);
    }
  }
  if (candidates.length === 0) {
    return undefined;
  }
  return candidates[candidates.length - 1];
};

const findLatestVideoFile = async (
  rootDir: string,
  minMtimeMs: number,
  maxDepth: number,
) => {
  const queue: Array<{ dir: string; depth: number }> = [
    { dir: rootDir, depth: 0 },
  ];
  let latestPath: string | undefined;
  let latestTime = 0;
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    const entries = await readdir(current.dir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = join(current.dir, entry.name);
      if (entry.isDirectory()) {
        if (current.depth < maxDepth) {
          queue.push({ dir: entryPath, depth: current.depth + 1 });
        }
        continue;
      }
      if (
        videoExtensions.some((ext) => entry.name.toLowerCase().endsWith(ext))
      ) {
        const entryStat = await stat(entryPath);
        if (entryStat.mtimeMs >= minMtimeMs && entryStat.mtimeMs > latestTime) {
          latestTime = entryStat.mtimeMs;
          latestPath = entryPath;
        }
      }
    }
  }
  return latestPath;
};

const listVideoFiles = async (rootDir: string, maxDepth: number) => {
  const queue: Array<{ dir: string; depth: number }> = [
    { dir: rootDir, depth: 0 },
  ];
  const results: Array<{ path: string; mtimeMs: number; size: number }> = [];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    const entries = await readdir(current.dir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = join(current.dir, entry.name);
      if (entry.isDirectory()) {
        if (current.depth < maxDepth) {
          queue.push({ dir: entryPath, depth: current.depth + 1 });
        }
        continue;
      }
      if (
        videoExtensions.some((ext) => entry.name.toLowerCase().endsWith(ext))
      ) {
        const entryStat = await stat(entryPath);
        results.push({
          path: entryPath,
          mtimeMs: entryStat.mtimeMs,
          size: entryStat.size,
        });
      }
    }
  }
  return results;
};

const resolveOutputFile = async (
  outputFile: string,
  tmpDir: string,
  renderStart: number,
) => {
  const outputExt = extname(outputFile).toLowerCase();
  const outputBase = basename(outputFile, outputExt);
  const outputDir = dirname(outputFile);
  const primaryReady = await waitForFile(outputFile, 120000);
  if (primaryReady) {
    return outputFile;
  }
  for (const ext of videoExtensions) {
    if (ext === outputExt) {
      continue;
    }
    const alternate = join(outputDir, `${outputBase}${ext}`);
    const alternateReady = await waitForFile(alternate, 2000);
    if (alternateReady) {
      return alternate;
    }
  }
  const fallbackFile = join(process.cwd(), basename(outputFile));
  const fallbackReady = await waitForFile(fallbackFile, 5000);
  if (fallbackReady) {
    return fallbackFile;
  }
  for (const ext of videoExtensions) {
    const fallbackAlternate = join(process.cwd(), `${outputBase}${ext}`);
    const fallbackAlternateReady = await waitForFile(fallbackAlternate, 2000);
    if (fallbackAlternateReady) {
      return fallbackAlternate;
    }
  }
  const outputPrefix = outputBase;
  try {
    const entries = await readdir(tmpDir);
    const candidates = entries.filter((name) =>
      videoExtensions.some((ext) => name.toLowerCase().endsWith(ext)),
    );
    if (candidates.length === 0) {
      return undefined;
    }
    let latest = candidates[0];
    let latestTime = 0;
    for (const candidate of candidates) {
      const candidatePath = join(tmpDir, candidate);
      const candidateStat = await stat(candidatePath);
      const candidateBase = basename(candidate, extname(candidate));
      if (
        candidateStat.mtimeMs > latestTime &&
        candidateStat.mtimeMs >= renderStart - 1000 &&
        (candidateBase.startsWith(outputPrefix) || latestTime === 0)
      ) {
        latestTime = candidateStat.mtimeMs;
        latest = candidate;
      }
    }
    if (latestTime >= renderStart - 1000) {
      return join(tmpDir, latest);
    }
    const prefixCandidates = candidates.filter((name) =>
      basename(name, extname(name)).startsWith(outputPrefix),
    );
    if (prefixCandidates.length === 0) {
      return undefined;
    }
    let fallbackLatest = prefixCandidates[0];
    let fallbackLatestTime = 0;
    for (const candidate of prefixCandidates) {
      const candidatePath = join(tmpDir, candidate);
      const candidateStat = await stat(candidatePath);
      if (candidateStat.mtimeMs > fallbackLatestTime) {
        fallbackLatestTime = candidateStat.mtimeMs;
        fallbackLatest = candidate;
      }
    }
    if (fallbackLatestTime > 0) {
      return join(tmpDir, fallbackLatest);
    }
    const recursiveMatch = await findLatestVideoFile(
      tmpDir,
      renderStart - 1000,
      6,
    );
    if (recursiveMatch) {
      return recursiveMatch;
    }
    const outputDirMatch =
      outputDir !== tmpDir
        ? await findLatestVideoFile(outputDir, renderStart - 1000, 5)
        : undefined;
    if (outputDirMatch) {
      return outputDirMatch;
    }
    const cwdMatch = await findLatestVideoFile(
      process.cwd(),
      renderStart - 1000,
      4,
    );
    if (cwdMatch) {
      return cwdMatch;
    }
    const looseTmpMatch = await findLatestVideoFile(tmpDir, 0, 6);
    if (looseTmpMatch) {
      return looseTmpMatch;
    }
    const looseOutputMatch =
      outputDir !== tmpDir ? await findLatestVideoFile(outputDir, 0, 5) : undefined;
    if (looseOutputMatch) {
      return looseOutputMatch;
    }
    const looseCwdMatch = await findLatestVideoFile(process.cwd(), 0, 4);
    if (looseCwdMatch) {
      return looseCwdMatch;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

const startFileServer = async (
  fileMap: Map<string, { path: string; mime: string }>,
) => {
  const server = createServer((req, res) => {
    if (!req.url) {
      res.statusCode = 404;
      res.end();
      return;
    }
    const url = new URL(req.url, 'http://127.0.0.1');
    const key = url.pathname.replace(/^\/+/, '');
    const entry = fileMap.get(key);
    if (!entry) {
      res.statusCode = 404;
      res.end();
      return;
    }
    readFile(entry.path)
      .then((buffer) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', entry.mime);
        res.end(buffer);
      })
      .catch(() => {
        res.statusCode = 404;
        res.end();
      });
  });
  const baseUrl = await new Promise<string>((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        resolve(`http://127.0.0.1:${address.port}`);
      } else {
        reject(new Error('Failed to start local server'));
      }
    });
    server.on('error', reject);
  });
  return { server, baseUrl };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { compositionId, inputProps, outputPath } = renderRequestSchema.parse(body);

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let propsFile: string | undefined;
        let outputFile: string | undefined;
        const tempFiles: string[] = [];
        let localServer: ReturnType<typeof createServer> | undefined;
        let localBaseUrl = '';
        let abortHandler: (() => void) | undefined;
        
        const sendProgress = (data: {
          stage: 'preparing' | 'bundling' | 'rendering' | 'finalizing' | 'done' | 'error';
          progress?: number;
          videoBase64?: string;
          fileName?: string;
          error?: string;
        }) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          sendProgress({ stage: 'preparing', progress: 0 });

          // 1. 创建临时props文件
          const tmpDir = tmpdir();
          const fileMap = new Map<string, { path: string; mime: string }>();
          const serverInfo = await startFileServer(fileMap);
          localServer = serverInfo.server;
          localBaseUrl = serverInfo.baseUrl;
          propsFile = join(tmpDir, `props-${Date.now()}.json`);
          const nextInputProps = { ...inputProps };

          if (inputProps.coverImageDataUrl) {
            const result = await writeDataUrlToTempFile(
              inputProps.coverImageDataUrl,
              'cover-image',
              tmpDir,
              localBaseUrl,
              fileMap,
            );
            nextInputProps.coverImageDataUrl = result.value;
            if (result.filePath) {
              tempFiles.push(result.filePath);
            }
          }
          if (inputProps.coverVideoDataUrl) {
            const result = await writeDataUrlToTempFile(
              inputProps.coverVideoDataUrl,
              'cover-video',
              tmpDir,
              localBaseUrl,
              fileMap,
            );
            nextInputProps.coverVideoDataUrl = result.value;
            if (result.filePath) {
              tempFiles.push(result.filePath);
            }
          }
          if (inputProps.logoImageDataUrl) {
            const result = await writeDataUrlToTempFile(
              inputProps.logoImageDataUrl,
              'logo-image',
              tmpDir,
              localBaseUrl,
              fileMap,
            );
            nextInputProps.logoImageDataUrl = result.value;
            if (result.filePath) {
              tempFiles.push(result.filePath);
            }
          }
          if (inputProps.audioDataUrl) {
            const result = await writeDataUrlToTempFile(
              inputProps.audioDataUrl,
              'audio',
              tmpDir,
              localBaseUrl,
              fileMap,
            );
            nextInputProps.audioDataUrl = result.value;
            if (result.filePath) {
              tempFiles.push(result.filePath);
            }
          }

          await writeFile(propsFile, JSON.stringify(nextInputProps));
          outputFile = resolveRequestedOutputPath(
            outputPath,
            tmpDir,
            nextInputProps.title,
          );
          sendProgress({ stage: 'preparing', progress: 50 });

          // 2. 使用Remotion CLI渲染
          sendProgress({ stage: 'rendering', progress: 0 });
          
          const browserExecutable = resolveBrowserExecutable();
          const durationFrames =
            typeof nextInputProps.durationInFrames === 'number' &&
            nextInputProps.durationInFrames > 0
              ? Math.floor(nextInputProps.durationInFrames)
              : undefined;
          const buildRenderArgs = (): string[] => {
            if (!propsFile || !outputFile) {
              throw new Error('Props file or output file is missing.');
            }
            const entryFile = join(process.cwd(), 'src', 'remotion', 'index.ts');
            if (!existsSync(entryFile)) {
              throw new Error('Remotion entry file is missing.');
            }
            const cliEntryFile = entryFile.replace(/\\/g, '/');
            const cliPropsFile = propsFile.replace(/\\/g, '/');
            const cliOutputFile = outputFile.replace(/\\/g, '/');
            const args = [
              'remotion',
              'render',
              cliEntryFile,
              compositionId,
              cliOutputFile,
              '--props',
              cliPropsFile,
              '--log=verbose',
            ];
            if (browserExecutable) {
              args.push(
                '--browser-executable',
                browserExecutable.replace(/\\/g, '/'),
              );
            } else {
              args.push('--chrome-mode=chrome-for-testing');
            }
            if (durationFrames) {
              args.push('--duration-in-frames', String(durationFrames));
            }
            return args;
          };

          const renderArgs = buildRenderArgs();
          console.log(
            'Executing command:',
            `node ${renderArgs.join(' ')}`.replace('node remotion', 'npx remotion'),
          );

          // 执行命令并捕获进度
          const renderStart = Date.now();
          const preRenderFiles = await listVideoFiles(tmpDir, 3);
          const preRenderFileSet = new Set(preRenderFiles.map((item) => item.path));
          const childProcess = spawn('node', [
            './node_modules/@remotion/cli/dist/index.js',
            ...renderArgs.slice(1),
          ], {
            cwd: process.cwd(),
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe'],
          });

          let lastProgress = 0;
          let stderrTail = '';
          let stdoutTail = '';
          
          // 监听stdout以获取进度信息
          childProcess.stdout?.on('data', (data: Buffer) => {
            const output = data.toString();
            console.log('Remotion output:', output);
            stdoutTail = `${stdoutTail}${output}`;
            if (stdoutTail.length > 8000) {
              stdoutTail = stdoutTail.slice(-8000);
            }
            
            // 尝试解析进度信息
            const progressMatch = output.match(/(\d+)%/);
            if (progressMatch) {
              const progress = parseInt(progressMatch[1]);
              if (progress > lastProgress) {
                lastProgress = progress;
                sendProgress({ stage: 'rendering', progress });
              }
            }
          });

          childProcess.stderr?.on('data', (data: Buffer) => {
            const chunk = data.toString();
            console.error('Remotion error:', chunk);
            stderrTail = `${stderrTail}${chunk}`;
            if (stderrTail.length > 8000) {
              stderrTail = stderrTail.slice(-8000);
            }
          });

          abortHandler = () => {
            if (!childProcess.killed) {
              childProcess.kill();
            }
          };
          request.signal?.addEventListener('abort', abortHandler);

          // 等待命令完成
          await new Promise<void>((resolve, reject) => {
            childProcess.on('error', (error: Error) => {
              reject(
                new Error(
                  `Remotion command failed to start: ${error.message}${
                    stderrTail ? `\n${stderrTail}` : ''
                  }`,
                ),
              );
            });
            childProcess.on(
              'close',
              (code: number | null, signal: NodeJS.Signals | null) => {
                if (code === 0) {
                  resolve();
                  return;
                }
                const reason = signal
                  ? `signal ${signal}`
                  : `exit code ${code ?? 'unknown'}`;
                reject(
                  new Error(
                    `Remotion command failed with ${reason}${
                      stderrTail ? `\n${stderrTail}` : ''
                    }`,
                  ),
                );
              },
            );
          });
          request.signal?.removeEventListener('abort', abortHandler);

          sendProgress({ stage: 'finalizing', progress: 0 });

          const logOutputFile = extractOutputFileFromLogs(stdoutTail, stderrTail);
          let resolvedOutputFile: string | undefined;
          if (logOutputFile) {
            const logReady = await waitForFile(logOutputFile, 5000);
            if (logReady) {
              resolvedOutputFile = logOutputFile;
            }
          }
          if (!resolvedOutputFile) {
            resolvedOutputFile = await resolveOutputFile(outputFile, tmpDir, renderStart);
          }
          if (!resolvedOutputFile) {
            const outputDir = dirname(outputFile);
            const postTmpFiles = await listVideoFiles(tmpDir, 6);
            const postOutputFiles =
              outputDir !== tmpDir ? await listVideoFiles(outputDir, 5) : [];
            const postCwdFiles = await listVideoFiles(process.cwd(), 4);
            const allCandidates = [
              ...postTmpFiles,
              ...postOutputFiles,
              ...postCwdFiles,
            ];
            const newFiles = allCandidates.filter(
              (item) =>
                !preRenderFileSet.has(item.path) &&
                item.mtimeMs >= renderStart - 1000 &&
                item.size > 0,
            );
            const recentFiles =
              newFiles.length > 0
                ? newFiles
                : allCandidates.filter(
                    (item) => item.mtimeMs >= renderStart - 1000 && item.size > 0,
                  );
            const fallbackFiles =
              recentFiles.length > 0
                ? recentFiles
                : allCandidates.filter((item) => item.size > 0);
            const latestCandidate = fallbackFiles.sort(
              (a, b) => b.mtimeMs - a.mtimeMs,
            )[0];
            if (latestCandidate?.path) {
              resolvedOutputFile = latestCandidate.path;
            }
          }
          if (!resolvedOutputFile) {
            throw new Error(
              `Render completed without output file.${
                stderrTail ? `\n${stderrTail}` : ''
              }${stdoutTail ? `\n${stdoutTail}` : ''}`,
            );
          }
          const videoBuffer = await readFile(resolvedOutputFile);
          const videoBase64 = videoBuffer.toString('base64');

          // 5. 发送最终结果
          const fileName = resolvedOutputFile
            ? basename(resolvedOutputFile)
            : `${getSafeTitle(nextInputProps.title)}.mp4`;
          sendProgress({ 
            stage: 'done', 
            progress: 100,
            videoBase64,
            fileName
          });

          controller.close();

        } catch (error) {
          console.error('CLI Render error:', error);
          sendProgress({ 
            stage: 'error', 
            error: error instanceof Error ? error.message : String(error) 
          });
          controller.close();
        } finally {
          if (abortHandler) {
            request.signal?.removeEventListener('abort', abortHandler);
          }
          if (localServer) {
            await new Promise<void>((resolve) => {
              localServer?.close(() => resolve());
            });
          }
          await Promise.all(tempFiles.map((filePath) => safeUnlink(filePath)));
          await safeUnlink(propsFile);
          await safeUnlink(outputFile);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('CLI Request error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 
