100%
Развернутый код
try {
    window.DataTableVue = {
        mount: function (selector) {
            const element = document.querySelector(selector);
            if (!element) {
                console.error('Element not found:', selector);
                return
            }
            let currentConfig = '';
            const fetchData = (config) => {
                fetch(config.requestUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        filters: config.requestParams,
                        pager: config.requestParams.pager,
                        order: config.order
                    })
                }) .then(response => {
                    if (!response.ok)
                    throw new Error(`HTTP error: $ {
                        response.status
                    }`);
                    return response.json()
                }) .then(data => {
                    document.dispatchEvent(new CustomEvent('datatable:dataLoaded', {
                        detail: data
                    }));
                    if (data ? .results ? .summary) {
                        document.dispatchEvent(new CustomEvent('summary:loaded', {
                            detail: data.results.summary
                        }))
                    }
                }) .
                catch(error => {
                    document.dispatchEvent(new CustomEvent('datatable:error', {
                        detail: {
                            message: error.message
                        }
                    }))
                })
            };
            document.addEventListener('datatable:setConfig', (e) => {
                currentConfig = e.detail;
                fetchData(currentConfig)
            });
            document.addEventListener('datatable:reload', () => {
                if (currentConfig) {
                    fetchData(currentConfig)
                } else {
                    console.log('No config available for reload')
                }
            })
        }
    };
    const datatable = document.getElementById('datatable');
    if (datatable &&  window.DataTableVue.mount) {
        window.DataTableVue.mount("#datatable")
    }
} catch (e) {
    console.log('Error in index-vcsAY5z7.js:', e)
}