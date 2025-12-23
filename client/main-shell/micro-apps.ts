import { registerMicroApps, start } from 'qiankun';

registerMicroApps([
  {
    name: 'admin-builder',
    entry: '//127.0.0.1:3001',
    container: '#subapp-container',
    activeRule: '/builder',
  },
  {
    name: 'client-runtime',
    entry: '//127.0.0.1:3002',
    container: '#subapp-container',
    activeRule: '/runtime',
  },
]);

start();
