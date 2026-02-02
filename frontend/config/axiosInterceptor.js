import { ApiUrl } from "@/components/Constants/apiEndpoints";
import axios from "axios";
import https from "https";

const BASEURL = ApiUrl;

let timeout = 30000;
const httpsAgent = new https.Agent({
  rejectUnauthorized: true,
});

const axiosDefaultInstance = axios.create({
  BASEURL: BASEURL,
  timeout: 30000,
  mode: "no-cors",
  httpsAgent,
});

// Add a request interceptor
axiosDefaultInstance.interceptors.request.use(
  (config) => {
    // Do something before request is sent
    return Promise.resolve(config);
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosDefaultInstance.interceptors.response.use(
  (response) => {
    // Do something with response data
    return Promise.resolve(response);
  },
  (error) => {
    // Do something with response error
    return Promise.reject(error);
  }
);

export const getRequest = ({ url, params = "", token }) => {
  return axiosDefaultInstance.get(`${BASEURL + url + params}`, {
    timeout: timeout,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const postRequestV2 = ({ url, body, token }) => {
  return axiosDefaultInstance.post(`${BASEURL + url}`, body, {
    timeout: timeout,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const postRequest = ({ url, params = "", body, token }) => {
  return axiosDefaultInstance.post(`${BASEURL + url + params}`, body, {
    timeout: timeout,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const putRequest = ({ url, body, token }) => {
  return axiosDefaultInstance.put(`${BASEURL + url}`, body, {
    timeout: timeout,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const putRequestV2 = ({ url, params = "", data = {}, token }) => {
  return axiosDefaultInstance.put(`${BASEURL + url + params}`, data, {
    timeout: timeout,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};