/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/**/*': ['./db_anime.db'],
  },
  async rewrites() {
    return [
      {
        source: '/((?!api|images|_next|favicon.ico).*)',
        destination: '/',
      },
    ];
  },
};

export default nextConfig;
