import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { createGunzip } from "node:zlib";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/exrates": {
          target: "https://pro-api.coinmarketcap.com",
          changeOrigin: true,
          rewrite: () => "/v3/cryptocurrency/quotes/latest?id=1&convert=EUR",
          selfHandleResponse: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("X-CMC_PRO_API_KEY", env.CMC_API_KEY ?? "");
              proxyReq.setHeader("Accept", "application/json");
              // Remove Accept-Encoding so CMC returns plain text, not gzip
              proxyReq.removeHeader("Accept-Encoding");
            });
            proxy.on("proxyRes", (proxyRes, _req, res) => {
              const encoding = proxyRes.headers["content-encoding"];
              let body = "";

              const stream = encoding === "gzip" ? proxyRes.pipe(createGunzip()) : proxyRes;

              stream.setEncoding("utf8");
              stream.on("data", (chunk: string) => {
                body += chunk;
              });
              stream.on("end", () => {
                try {
                  const parsed = JSON.parse(body);
                  const price = parsed?.data?.[0]?.quote?.[0]?.price ?? 0;
                  const json = JSON.stringify({ BTC: price });
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(json);
                } catch (e) {
                  console.error("[exrates proxy] parse error:", e);
                  console.error("[exrates proxy] raw body:", body);
                  res.writeHead(500);
                  res.end('{"error":"Failed to parse CMC response"}');
                }
              });
              stream.on("error", (err: Error) => {
                console.error("[exrates proxy] stream error:", err);
                res.writeHead(500);
                res.end('{"error":"Stream error"}');
              });
            });
            proxy.on("error", (err) => {
              console.error("[exrates proxy] error:", err);
            });
          },
        },
      },
    },
  };
});
