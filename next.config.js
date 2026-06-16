/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: new URL(".", import.meta.url).pathname,
  allowedDevOrigins: [
    "192.168.100.192",
    "*.loca.lt",
    "ten-symbols-repeat.loca.lt",
    "evil-toys-vanish.loca.lt",
    "*.trycloudflare.com",
    "rap-inform-navy-pop.trycloudflare.com",
    "conventional-mon-printing-judicial.trycloudflare.com"
  ]
};

export default nextConfig;
