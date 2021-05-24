
export class Util {
    static isEmptyString(str) {
        if (str == undefined || str == null || str == "") {
            return true;
        }
        else {
            return false;
        }
    }
}