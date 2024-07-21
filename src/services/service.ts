import axios from "axios";

const JS_APP_KEY = "88b7c5194397b5c9105ee91e76e2bf94";
const REDIRECT_URI = "http://localhost:8080/auth";

export const getKaKaoUserInfo = async (code: string) => {
    interface DataType {
        [key: string]: string;
    }

    const data: DataType = {
        grant_type: "authorization_code",
        client_id: JS_APP_KEY,
        redirect_uri: REDIRECT_URI,
        code,
    };

    const options = {
        method: "post",
        url: "https://kauth.kakao.com/oauth/token",
        data: Object.keys(data)
            .map((k: string) => encodeURIComponent(k) + "=" + encodeURIComponent(data[k]))
            .join("&"),
    };

    try {
        // get kakao token
        const token = await axios(options);
        // console.log(token)

        // 받은 토큰으로 유저 정보 받기
        const user = await axios({
            method: "get",
            url: "https://kapi.kakao.com/v2/user/me",
            headers: {
                Authorization: `Bearer ${token.data.access_token}`,
            },
        });

        const result = user.data;
        // console.log(user);

        return result;
    } catch (err) {
        console.log(err);
        return { err };
    }
};
