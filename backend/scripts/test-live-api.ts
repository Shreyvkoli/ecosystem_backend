import axios from 'axios';

async function test() {
  try {
    console.log('Logging in as editor (e1)...');
    const loginRes = await axios.post('https://ecosystem-backend-1.onrender.com/api/auth/login', {
      email: 'e1@gmail.com',
      password: '123456789'
    });
    
    const token = loginRes.data.token;
    console.log('Login successful. Token:', token.substring(0, 10) + '...');
    
    console.log('Fetching creators...');
    const creatorsRes = await axios.get('https://ecosystem-backend-1.onrender.com/api/users/creators/profiles', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Response status:', creatorsRes.status);
    console.log('Creators count:', creatorsRes.data.length);
    if (creatorsRes.data.length > 0) {
        console.log('First creator:', creatorsRes.data[0]);
    } else {
        console.log('Empty array returned!');
    }
  } catch (err: any) {
    console.error('Error:', err.response?.status, err.response?.data || err.message);
  }
}

test();
