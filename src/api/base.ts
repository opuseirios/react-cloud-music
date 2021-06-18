import axios,{AxiosResponse,AxiosRequestConfig} from "axios";
import {Toast} from "antd-mobile";
import {baseURL} from "./config";


interface axiosConfig extends AxiosRequestConfig{
    hideLoading?:boolean
}

const axiosInstance = axios.create({
    baseURL,
    timeout: 60000
})

axiosInstance.interceptors.request.use((config:axiosConfig)=>{
    if(!config.hideLoading){
        Toast.loading('正在加载....',0)
    }
    return config
},()=>{
    Toast.hide()
    return Promise.resolve({errorCode:'E002',msg:'E002:请检查网络'})
})

axiosInstance.interceptors.response.use((response:AxiosResponse)=>{
    Toast.hide();
    return response.data;
},()=>{
    Toast.hide();
    return Promise.resolve({errorCode:'E001',msg:'E001:请检查网络'})
})


const res:any = {}
res.before = ()=>{}

Array.prototype.forEach.call(['post','get','delete','put'],item=>{
    res[item] = function (url:string,data:any={},config:any={}) {
        res.before(config);
        if(item==='get'){
            // @ts-ignore
            return axiosInstance[item](url,{params:data,...config})
        }
        data = (data===undefined||data===null)?{}:data;
        // @ts-ignore
        return  axiosInstance[item](url,data,config)
    }
})


export default res;
