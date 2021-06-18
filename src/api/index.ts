import axios from './base'

const api = {
    getBannerList:()=>axios.get('/banner'),
}

export default api
