import { Injectable } from '@nestjs/common';
import axios from 'axios';

import { KakaoUser } from '../auth.interface';

interface KakaoOAuthRequestData {
  [key: string]: string;
}

@Injectable()
export class LoginService {
  async getKaKaoUserInfo(code: string): Promise<KakaoUser> {
    try {
      const data: KakaoOAuthRequestData = {
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_JS_APP_KEY!,
        redirect_uri: process.env.KAKAO_REDIRECT_URI!,
        code,
      };

      const options = {
        method: 'post',
        url: 'https://kauth.kakao.com/oauth/token',
        data: Object.keys(data)
          .map(
            (k: string) =>
              encodeURIComponent(k) + '=' + encodeURIComponent(data[k]),
          )
          .join('&'),
      };

      // get kakao token
      const token = await axios(options);

      // 받은 토큰으로 유저 정보 받기
      const user = await axios({
        method: 'get',
        url: 'https://kapi.kakao.com/v2/user/me',
        headers: {
          Authorization: `Bearer ${token.data.access_token}`,
        },
      });

      const result: KakaoUser = user.data;

      return result;
    } catch (error) {
      throw error;
    }
  }
}
