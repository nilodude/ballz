import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  // build: {
  //   emptyOutDir: true,
  //   rollupOptions: {
  //       output: {
  //           assetFileNames: ({name}) => {
               
  //               if (/\.(gif|jpe?g|png|svg|webp)$/.test(name ?? '')){
  //                   return 'assets/images/[name]-[hash][extname]';
  //               }
                
  //               if (/\.(glb)$/.test(name ?? '')){
  //                 return 'assets/models/[name]-[hash][extname]';
  //               }
            

  //               return 'assets/[name]-[hash][extname]';  
  //           }
  //       },
  //   }
// },
})