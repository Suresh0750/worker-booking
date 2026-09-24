/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'res.cloudinary.com', 'lh3.googleusercontent.com',"br-long-resonance-ahr4w2ov.storage.c-3.us-east-1.aws.neon.tech"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uploads.s3.us-east-1.amazonaws.com',
        pathname: '/**'
      }
    ],
  },
}

module.exports = nextConfig
