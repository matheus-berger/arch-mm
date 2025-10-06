import axios from 'axios';

const api = axios.create({
  // Define o timeout de 10 segundos (em milissegundos)
  timeout: 10000,
});

// (Bônus) Adiciona um "interceptor" para logar todas as requisições que saem.
// Isso é extremamente útil para depurar a comunicação entre os serviços.
api.interceptors.request.use(request => {
  console.log('Starting Request to:', request.url);
  return request;
});

export default api;