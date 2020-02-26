import { Plugins } from '@capacitor/core';
const { Device } = Plugins;

export class Utils {

    /**
     * Método usado para crear un SHA-256 de la combinación de el oauthToken
     * del usuario y si es especificado, el UUID del dispositivo.
     * @param oauthToken token de la sesión actual del usuario.
     * @param appendDeviceInfo booleano usado para concatenar si es true, la info
     * del dispositivo a el hash generado junto con el oauthToken.
     * Si appendDeviceInfo no es especificado, por defecto es true.
     */
    static async createUserSessionToken(oauthToken: string, appendDeviceInfo: boolean = true): Promise<string> {
        const encoder = new TextEncoder();
        let deviceInfo;
        let data;

        if (appendDeviceInfo) {
            try {
                deviceInfo = await Device.getInfo();
            } catch (err) {
                throw err;
            }
            data = encoder.encode(oauthToken + deviceInfo.uuid);
        } else {
            data = encoder.encode(oauthToken);
        }

        let digest;
        try {
            digest = await crypto.subtle.digest("SHA-256", data);
        } catch (err) {
            throw err;
        }

        const hashArray = Array.from(new Uint8Array(digest));                     // convert buffer to byte array
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
        return hashHex;
    }


}