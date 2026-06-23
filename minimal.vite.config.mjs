import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

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

export default defineConfig({
  plugins: [
    vue(),
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
