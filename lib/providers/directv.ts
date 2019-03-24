import axios from 'axios';

import * as secrets from './secrets';

import * as querystring from 'query-string';
import * as helpers from "./oauth_helpers";

let oauth_params = {
    'response_type': "adobe",
    'affiliate_id': "57a9eb816b66d14b2ff8aedc",
    'auth_client_id': "DTV",
    'auth_client_url': '',
    'network_requestors': 'true',
    'asset_authz': 'false',
    'auth_ttl': '',
    'client_id': secrets.dfckey,
    'redirect_uri': 'https://www.discovery.com/',
    'state': 'github.com/judge2020/Discovery-Family-Stream/blob/master/LICENSE',
    'networks.code': 'DFC'
};


let loginData = {
    "username": secrets.dtv_username,
    "password": secrets.dtv_password
};

export function getBearerTokenDTV() {
    // begin the oauth(?) process
    return axios.get("https://login.discovery.com/v1/oauth2/authorize", {
        maxRedirects: 2,
        params: oauth_params,
        validateStatus: helpers.axiosValidateStatusAllowRedirects
    }).then((res) => {
        // since we use `maxRedirects` above, our request was redirected to Adobe's authentication service
        // url is sp.auth.adobe.com
        //console.log(res.data);

        // Adobe has a barebones page with a single form element
        // this code is in there (why JS is "required")
        // <body onload="document.forms[0].submit()">
        //
        // here we extract the form parameters and mimic the form post
        let adobeFirst = helpers.getAdobeFormFromHtml(res.data);

        return axios.post(decodeURIComponent(adobeFirst[0]), querystring.stringify(adobeFirst[1]), {
            headers: {
                'content-type': `application/x-www-form-urlencoded`,
                'origin': 'https://sp.auth.adobe.com',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
            },
        });
    }).then((res) => {
        // DirecTV's CSRF protection is this "stateInfo" in the query string.
        let stateInfo = querystring.parseUrl(res.request.path).query['stateInfo'];
        //console.log(stateInfo);

        // perform login with credentials
        return axios.post("https://as.dtvce.com/idp/login", querystring.stringify(loginData), {
            params: {
                'content-type': `application/x-www-form-urlencoded`,
                'stateInfo': stateInfo,
                'providerName': "IDP_DISCOVERYFAMILY_C01",
                'deviceType': 'iphone'
            }
        })
    }).then((res) => {
        let adobeLast = helpers.getAdobeFormFromHtml(res.data);

        return axios.post(decodeURIComponent(adobeLast[0]), querystring.stringify(adobeLast[1]), {
            headers: {
                'content-type': `application/x-www-form-urlencoded`,
                'origin': 'https://sp.auth.adobe.com',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
            },
            maxRedirects: 3,
            validateStatus: helpers.axiosValidateStatusAllowRedirects
        });
    }).then((res) => {
        let parsed = helpers.parseDiscoveryFinalResponse(res.request.res.responseUrl);
        // @ts-ignore
        let aaa = new helpers.DiscoveryTokenResponse(parsed.query['access_token'], Number(parsed.query['expires_in']));
        return Promise.resolve(aaa);
    });
}
