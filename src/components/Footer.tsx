"use client";

import React from "react";

export const Footer = () => {
  return (
    <footer className="w-full py-6 mt-12 border-t border-unfocused-border-color bg-background text-sm text-subtitle">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          &copy; {new Date().getFullYear()}{" "}
          <a
            href="https://www.17you.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            自游人
          </a>{" "}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span id="busuanzi_container_site_pv" style={{ display: "none" }}>
            PV <span id="busuanzi_value_site_pv" className="font-medium"></span>
          </span>
          <span className="w-px h-3 bg-unfocused-border-color"></span>
          <span id="busuanzi_container_site_uv" style={{ display: "none" }}>
            UV <span id="busuanzi_value_site_uv" className="font-medium"></span>
          </span>
        </div>
      </div>
    </footer>
  );
};
