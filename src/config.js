const dev = 'http://127.0.0.1:8000/api/'
const prod = '/api/'

export const apiUrl = process.env.NODE_ENV === 'development' ? dev:prod
