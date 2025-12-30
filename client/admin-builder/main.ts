import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'virtual:uno.css'
import router from './router'
import pinia from './store'
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'

let app: any = null

function render(props: any = {}) {
  const { container } = props
  
  app = createApp(App)
  app.use(ElementPlus)
  app.use(pinia)
  app.use(router)
  
  app.mount(container ? container.querySelector('#admin-app') : '#admin-app')
}

renderWithQiankun({
  mount(props) {
    console.log('admin-builder mount')
    render(props)
  },
  bootstrap() {
    console.log('admin-builder bootstrap')
  },
  unmount(props: any) {
    console.log('admin-builder unmount')
    app.unmount()
    app._container.innerHTML = ''
    app = null
  },
  update(props: any) {
    console.log('admin-builder update')
  }
})

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
