import { NextRequest } from 'next/server';
import { exec } from 'child_process';
import { existsSync } from 'fs';
import { createServer } from 'http';
import { writeFile, readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { z } from 'zod';

const renderRequestSchema = z.object({
  compositionId: z.string(),
  inputProps: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    badgeText: z.string().optional(),
    coverImageDataUrl: z.string().optional(),
    coverVideoDataUrl: z.string().optional(),
    logoImageDataUrl: z.string().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    accentColor: z.string().optional(),
    titleFontSize: z.number().optional(),
    subtitleFontSize: z.number().optional(),
    durationInFrames: z.number().optional(),
    coverMediaType: z.enum(["image", "video"]).optional(),
    audioDataUrl: z.string().optional(),
    mediaFit: z.enum(["cover", "contain"]).optional(),
    mediaPosition: z.enum(["center", "top", "bottom", "left", "right"]).optional(),
    layout: z.enum(["center", "left", "image-top"]).optional(),
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
  await writeFile(filePath, Buffer.from(base64, 'base64'));
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
    const { compositionId, inputProps } = renderRequestSchema.parse(body);

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let propsFile: string | undefined;
        let outputFile: string | undefined;
        const tempFiles: string[] = [];
        let localServer: ReturnType<typeof createServer> | undefined;
        let localBaseUrl = '';
        
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
          outputFile = join(tmpDir, `video-${Date.now()}.mp4`);
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
          sendProgress({ stage: 'preparing', progress: 50 });

          // 2. 使用Remotion CLI渲染
          sendProgress({ stage: 'rendering', progress: 0 });
          
          const browserExecutable = resolveBrowserExecutable();
          const browserExecutableArg = browserExecutable
            ? ` --browser-executable="${browserExecutable}" --chrome-mode=chrome-for-testing`
            : '';
          const command = `npx remotion render ${compositionId} "${outputFile}" --props="${propsFile}"${browserExecutableArg} --log=verbose`;
          
          console.log('Executing command:', command);
          
          // 执行命令并捕获进度
          const childProcess = exec(command, { 
            cwd: process.cwd(),
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
          });

          let lastProgress = 0;
          let stderrTail = '';
          
          // 监听stdout以获取进度信息
          childProcess.stdout?.on('data', (data: Buffer) => {
            const output = data.toString();
            console.log('Remotion output:', output);
            
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

          // 等待命令完成
          await new Promise<void>((resolve, reject) => {
            childProcess.on('error', (error) => {
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

          // 3. 读取生成的视频文件
          sendProgress({ stage: 'finalizing', progress: 0 });
          
          const videoBuffer = await readFile(outputFile);
          const videoBase64 = videoBuffer.toString('base64');

          // 5. 发送最终结果
          sendProgress({ 
            stage: 'done', 
            progress: 100,
            videoBase64,
            fileName: `${nextInputProps.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`
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
