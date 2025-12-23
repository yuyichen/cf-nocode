import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'virtual:uno.css'
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'

let app: any = null

function render(props: any = {}) {
  const { container } = props
  app = createApp(App)
  app.use(ElementPlus)
  app.mount(container ? container.querySelector('#runtime-app') : '#runtime-app')
}

renderWithQiankun({
  mount(props) {
    console.log('client-runtime mount')
    render(props)
  },
  bootstrap() {
    console.log('client-runtime bootstrap')
  },
  unmount(props: any) {
    console.log('client-runtime unmount')
    app.unmount()
    app._container.innerHTML = ''
    app = null
  },
  update(props: any) {
    console.log('client-runtime update')
  }
})

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
