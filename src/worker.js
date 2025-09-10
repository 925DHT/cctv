const IP_SOURCE_URL = "https://raw.githubusercontent.com/ethgan/yxip/main/ip.txt";
const KV_KEY = "best_ips";
const NODE_COUNT = 20;

async function fetchIPs() {
  const resp = await fetch(IP_SOURCE_URL, { cf: { cacheTtl: 60 } });
  if (!resp.ok) throw new Error("Failed to fetch IPs");
  const text = await resp.text();
  return text
    .split("\n")
    .map(line => line.trim())
    .filter(ip => ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip))
    .slice(0, NODE_COUNT);
}

function genClashNodes(ips) {
  return ips.map((ip, idx) => ({
    name: `优选${idx + 1}`,
    type: "ss",
    server: ip,
    port: 443,
    cipher: "aes-128-gcm",
    password: "openclash",
    plugin: "v2ray-plugin",
    "plugin-opts": {
      mode: "websocket",
      tls: true,
      host: "www.netflix.com"
    }
  }));
}

function genClashConfig(nodes) {
  return [
    "port: 7890",
    "socks-port: 7891",
    "allow-lan: true",
    "mode: Rule",
    "log-level: info",
    "external-controller: '127.0.0.1:9090'",
    "proxies:",
    ...nodes.map(node =>
      "  - " +
      JSON.stringify(node)
        .replace(/"([^"]+)":/g, "$1:") 
        .replace(/^{/, "")
        .replace(/}$/, "")
        .replace(/,/g, "\n    ")
    ),
    "proxy-groups:",
    "  - name: \"自动选择\"",
    "    type: select",
    "    proxies:",
    ...nodes.map((_, i) => `      - 优选${i + 1}`),
    "rules:",
    "  - GEOIP,CN,DIRECT",
    "  - MATCH,自动选择"
  ].join("\n");
}

async function refreshIPs(env) {
  const ips = await fetchIPs();
  await env.OPENCLASH_KV.put(KV_KEY, JSON.stringify(ips));
}

export default {
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname === "/sub" || new URL(request.url).pathname === "/clash") {
      let ipJson = await env.OPENCLASH_KV.get(KV_KEY);
      let ips;
      if (!ipJson) {
        ips = await fetchIPs();
        ctx.waitUntil(env.OPENCLASH_KV.put(KV_KEY, JSON.stringify(ips)));
      } else {
        ips = JSON.parse(ipJson);
      }
      const nodes = genClashNodes(ips);
      const config = genClashConfig(nodes);
      return new Response(config, {
        headers: { "content-type": "text/yaml; charset=utf-8" }
      });
    }
    if(new URL(request.url).pathname === "/ping") {
      return new Response("ok", { headers: { "content-type": "text/plain" } });
    }
    return new Response("Not found", { status: 404 });
  },
  async scheduled(event, env, ctx) {
    await refreshIPs(env);
  }
};
