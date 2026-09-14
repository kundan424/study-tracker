// public/js/api.js

window.API = (function() {
  async function request(url, options = {}) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      if (response.status === 204) return null;
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error(`API Error on ${options.method || 'GET'} ${url}:`, error);
      if (window.App && window.App.showToast) {
        window.App.showToast(`Request failed: ${error.message}`);
      }
      throw error;
    }
  }

  return {
    get: function(url) {
      return request(url, { method: 'GET' });
    },
    
    post: function(url, data) {
      return request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    },
    
    put: function(url, data) {
      return request(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    },
    
    del: function(url) {
      return request(url, { method: 'DELETE' });
    }
  };
})();
