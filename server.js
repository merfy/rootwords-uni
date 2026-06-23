 const path = require('path');
 const { createServer } = require('vite');
 const fs = require('fs');
 
 // Load build version
 let buildVer = 0;
 try {
   const vp = path.resolve(__dirname, 'src', 'build-version.json');
   buildVer = JSON.parse(fs.readFileSync(vp, 'utf-8')).version || 0;
 } catch(e) { buildVer = 0; }
 
 // Import uni plugin
 const uni = require('@dcloudio/vite-plugin-uni').default;
 
 function uniAppPatchPlugin() {
   return {
     name: 'uni-app-patch',
     transform(code, id) {
       if (id.includes('@dcloudio/uni-app') && id.endsWith('.es.js')) {
         code = code.replace(
           `import { shallowRef, ref, getCurrentInstance, isInSSRComponentSetup, injectHook } from 'vue'`,
           `import { shallowRef, ref, getCurrentInstance, callWithAsyncErrorHandling } from 'vue'`
         );
         code = code.replace(
           '!isInSSRComponentSetup && injectHook(lifecycle, hook, target)',
           'uni_inject_hook(lifecycle, hook, target)'
         );
         code = `function uni_inject_hook(type, hook, target, prepend) {
   if (prepend === void 0) prepend = false;
   if (target) {
     const hooks = target[type] || (target[type] = []);
     const wrappedHook = hook.__weh || (hook.__weh = function() {
       var args = Array.prototype.slice.call(arguments);
       return callWithAsyncErrorHandling(hook, target, type, args);
     });
     if (prepend) {
       hooks.unshift(wrappedHook);
     } else {
       hooks.push(wrappedHook);
     }
     return wrappedHook;
   }
 }` + code;
         return { code };
       }
     }
   };
 }
 
 function createFixedUniPlugins() {
   const plugins = uni();
   for (const p of plugins) {
     if (p.name === 'uni' && p.config) {
       const origConfig = p.config;
       p.config = function(config, env) {
         const result = origConfig.call(this, config, env);
         if (result && result.optimizeDeps && result.optimizeDeps.exclude) {
           result.optimizeDeps.exclude = result.optimizeDeps.exclude.filter(
             (dep) => dep !== 'vue'
           );
         }
         return result;
       };
     }
     if (p.name === 'uni' && p.configResolved) {
       const origConfigResolved = p.configResolved;
       p.configResolved = function(resolvedConfig) {
         origConfigResolved.call(this, resolvedConfig);
         if (resolvedConfig.ssr?.external) {
           resolvedConfig.ssr.external = resolvedConfig.ssr.external.filter(
             (e) => e !== 'vue'
           );
         }
       };
     }
   }
   return plugins;
 }
 
 async function start() {
   try {
     const server = await createServer({
       configFile: false,
       root: __dirname,
       plugins: [
         {
           name: 'version-bump',
           enforce: 'pre',
           config(config, env) {
             return {
               define: {
                 __APP_VERSION__: JSON.stringify('v0.' + buildVer)
               }
             };
           }
         },
         ...createFixedUniPlugins(),
         uniAppPatchPlugin()
       ],
       resolve: {
         alias: { '@': path.resolve(__dirname, 'src') },
       },
       server: {
         port: 5173,
         host: true,
         fs: { strict: false, allow: ['.'] },
         watch: { ignored: ['**/node_modules/@dcloudio/**'] },
       },
     });
     await server.listen();
     console.log('✓ Dev server running at:');
     server.printUrls();
   } catch(e) {
     console.error('Failed to start server:', e.message);
     if (e.stack) console.error(e.stack.split('\n').slice(0, 8).join('\n'));
     process.exit(1);
   }
 }
 
 start();
