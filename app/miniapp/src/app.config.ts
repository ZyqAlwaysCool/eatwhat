export default defineAppConfig({
  // @ts-expect-error WeChat app.json field for wx.cloud / callContainer (omitted from Taro AppConfig).
  cloud: true,
  pages: [
    'pages/home/index',
    'pages/filters/index',
    'pages/result/index',
    'pages/candidates/index',
    'pages/history/index'
  ],
  window: {
    navigationBarTitleText: '今天吃什么',
    navigationBarBackgroundColor: '#fffdf7',
    navigationBarTextStyle: 'black',
    backgroundTextStyle: 'light',
    backgroundColor: '#f8fafc'
  }
})
