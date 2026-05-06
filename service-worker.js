/**
 * 本地小说音频播放器 - Service Worker
 * 用于缓存应用资源，支持离线访问
 */

// 应用版本号，更新应用时修改此值
const APP_VERSION = 'v1.0.0';

// 需要缓存的资源列表
const CACHE_NAME = `audio-player-${APP_VERSION}`;
const RESOURCES_TO_CACHE = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js'
];

// 安装Service Worker并缓存资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('缓存应用资源');
        return cache.addAll(RESOURCES_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活新的Service Worker并清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('audio-player-')) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截网络请求，优先从缓存返回资源
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果缓存中有资源，直接返回
        if (response) {
          return response;
        }

        // 否则发起网络请求
        return fetch(event.request)
          .then((response) => {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆响应，一份返回给浏览器，一份存入缓存
            const responseToCache = response.clone();
            
            // 只缓存同源资源
            const url = new URL(event.request.url);
            if (url.origin === self.location.origin) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch((error) => {
            console.error('网络请求失败:', error);
            // 如果网络请求失败且是导航请求，返回缓存中的首页
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// 处理推送通知
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || '有新消息',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '本地小说音频播放器', options)
  );
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const url = event.notification.data.url;
        
        // 如果已有打开的窗口，直接导航到目标URL
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // 否则打开新窗口
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// 处理后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-playlist') {
    event.waitUntil(syncPlaylist());
  }
});

// 同步播放列表数据的示例函数
async function syncPlaylist() {
  try {
    // 这里可以实现与服务器同步播放列表的逻辑
    console.log('同步播放列表数据');
    // 实际应用中，这里可能会从IndexedDB读取数据并发送到服务器
    return true;
  } catch (error) {
    console.error('同步播放列表失败:', error);
    return false;
  }
}