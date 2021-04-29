/**********************************/
//公用工具方法
/**********************************/

// 使用es6的padStart()方法来补0
function getYMDHMS(timestamp) {
    let time = new Date(timestamp)
    let year = time.getFullYear()
    const month = (time.getMonth() + 1).toString().padStart(2, '0')
    const date = (time.getDate()).toString().padStart(2, '0')
    const hours = (time.getHours()).toString().padStart(2, '0')
    const minute = (time.getMinutes()).toString().padStart(2, '0')
    const second = (time.getSeconds()).toString().padStart(2, '0')

    return year + '-' + month + '-' + date + ' ' + hours + ':' + minute + ':' + second
}