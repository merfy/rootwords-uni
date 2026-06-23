const { defineConfig } = require('vite');
const fs_bv = require('fs');
const path_bv = require('path');
const __VP = path_bv.resolve(__dirname, 'src/build-version.json');
let __VV = 0;
try { __VV = JSON.parse(fs_bv.readFileSync(__VP, 'utf-8')).version || 0; } catch (e) { __VV = 0; }
const uni = require('@dcloudio/vite-plugin-uni').default;
const path = require('path');

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

/**
 * Wraps the uni() plugin to remove 'vue' from optimizeDeps.exclude,
 * which causes "The entry point 'vue' cannot be marked as external" error with Vue 3.4+
 */
function createFixedUniPlugins() {
  const plugins = uni();
  for (const p of plugins) {
    // Patch the main 'uni' plugin's config hook to fix optimizeDeps
    if (p.name === 'uni' && p.config) {
      const origConfig = p.config;
      p.config = function (config, env) {
        const result = origConfig.call(this, config, env);
        if (result && result.optimizeDeps && result.optimizeDeps.exclude) {
          result.optimizeDeps.exclude = result.optimizeDeps.exclude.filter(
            (dep) => dep !== 'vue'
          );
        }
        return result;
      };
    }
    // Patch configResolved to fix ssr.external
    if (p.name === 'uni' && p.configResolved) {
      const origConfigResolved = p.configResolved;
      p.configResolved = function (resolvedConfig) {
        origConfigResolved.call(this, resolvedConfig);
        // Remove 'vue' from SSR external to prevent esbuild error
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

module.exports = defineConfig({
  plugins: [
    {
      name: 'version-bump',
      enforce: 'pre',
      config(config, env) {
        if (env.command === 'build') {
          try { const d = JSON.parse(fs_bv.readFileSync(__VP, 'utf-8')); d.version = (d.version || 0) + 1; fs_bv.writeFileSync(__VP, JSON.stringify(d, null, 2)); __VV = d.version; } catch(e) {}
        }
        return {
          define: {
            __APP_VERSION__: JSON.stringify('v0.' + (__VV))
          }
        };
      }
    },
    ...createFixedUniPlugins(),
    uniAppPatchPlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    fs: {
      strict: false,
         allow: ['.'],
    },
    watch: {
      ignored: ['**/node_modules/@dcloudio/**'],
    },
  },
});

