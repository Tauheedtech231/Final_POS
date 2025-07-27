// next.config.js
module.exports = {
 images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'nysooydnmnufoxwgdzae.supabase.co',
      pathname: '/storage/v1/object/public/images/**',
    },
  ],
},

};
