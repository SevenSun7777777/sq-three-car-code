export default function useIsPhone() {
    // 判断是否是手机端
/**
 * 判断当前设备是否为手机设备
 * @returns {boolean} 如果是手机设备返回true，否则返回false
 */
    const isPhone = () => {
    // 获取浏览器的userAgent字符串
        const userAgentInfo = navigator.userAgent;
    // 定义可能包含手机设备标识的关键字数组
        const Agents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
    // 初始化标志位，默认为false
        let flag = false;
    // 遍历Agents数组，检查userAgent中是否包含手机设备标识
        for (let v = 0; v < Agents.length; v++) {
        // 如果userAgent中包含当前设备标识，则设置flag为true并跳出循环
            if (userAgentInfo.indexOf(Agents[v]) > 0) {
                flag = true;
                break;
            }
        }
    // 返回最终结果
        return flag;
    }
    return isPhone()
}