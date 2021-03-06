$(document).ready(function () {
    
    var awsData = {
        region: 'ap-northeast-1',
        apiGatewayUrl: 'https://i2t9q78ae2.execute-api.ap-northeast-1.amazonaws.com/Prod/dashboard_embed_url?',
        dataStoreUrl: 'https://qs-companies.s3-ap-northeast-1.amazonaws.com/datastore.json',
        userName: getParameterValues('user'),
        email: getParameterValues('email'),
        companyName: getParameterValues('company'),
        groupName: getParameterValues('group'),
        resetDisabled: 'true', 
        undoRedoDisabled: 'true'
    }
    embedDashboardAuthenticated(awsData);
    
    function getParameterValues(param) {
        var url = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < url.length; i++) {
            var urlparam = url[i].split('=');
            if (urlparam[0].toLowerCase() === param) {
                return decodeURIComponent(urlparam[1]);
            }
        }
    }

    function onVisualLoaded() {
        var div = document.getElementById("loadedContainer");
        div.innerHTML = "Dashboard fully loaded";
    }

    function onError() {
        var div = document.getElementById("errorContainer");
        div.innerHTML = "your seesion has expired";
    }

    function embedDashboard(embedUrl) {
        var containerDiv = document.getElementById("dashboardContainer");
        var params = {
                url: embedUrl,
                container: containerDiv,
                height: "1500px"
            };
            var dashboard = QuickSightEmbedding.embedDashboard(params);
            dashboard.on('error', onError);
            dashboard.on('load', onVisualLoaded);
    }

    function embedDashboardAuthenticated(awsData) {
        AWS.config.update({ region: awsData.region });

        console.log("awsData:", awsData);

        const dataStorePromice = getDataStore(awsData.dataStoreUrl);
        console.log("dataStorePromice:", dataStorePromice, typeof(dataStorePromice));

        dataStorePromice.then(function(result){
            const dataStoreResult = result;
		    console.log("dataStoreResult:", dataStoreResult);

            const com = dataStoreResult.find((com) => com.name === awsData.companyName);
            console.log("com:", com);
            if (typeof com === "undefined" ) {
                throw "no exist Company:" + awsData.companyName;
            }

            const dep = com.departments.find((dep) => dep.name === awsData.groupName);
            console.log("dep:", dep);
            if (typeof dep === "undefined" ) {
                throw "no exist Group:" + awsData.groupName;
            }

            const user = dep.users.find((user) => user === awsData.userName);
            console.log("user:", user);
            if (typeof user === "undefined" ) {
                throw "no exist User:" + awsData.userName;
            }

            const namespace = "NS-" + com.id + "-" + awsData.companyName;
            apiGatewayGetDashboardEmbedUrl(
                awsData.apiGatewayUrl,
                dep.dashboard,
                awsData.userName,
                awsData.email,
                namespace,
                awsData.groupName,
                awsData.resetDisabled,
                awsData.undoRedoDisabled
            );
        }, function(err){
            console.log(err, err.stack);
        });


    }

    async function getDataStore(dataStoreUrl) {
        try {
          const headers = {
            'Content-Type' : 'application/json'
          };
          const res = await axios.get(dataStoreUrl, { headers: headers});
          const items = JSON.parse(JSON.stringify(res.data));
          return items;
        } catch (err) {
          console.error(err);
        }
	};

    function apiGatewayGetDashboardEmbedUrl(
        apiGatewayUrl, 
        dashboardId, 
        userName, 
        email, 
        namespace, 
        groupName, 
        resetDisabled, 
        undoRedoDisabled
    ) {
        const parameters = {
           dashboardId: dashboardId, 
           userName: userName, 
           email: email, 
           namespace: namespace, 
           groupName: groupName, 
           resetDisabled: resetDisabled, 
           undoRedoDisabled: undoRedoDisabled
        }
        console.log("parameters:", parameters);

        const myQueryString = $.param(parameters);
        apiGatewayUrl = apiGatewayUrl + myQueryString;

        const headers = {
          'Content-Type' : 'application/json'
        };

        axios.get(apiGatewayUrl, { headers: headers})
            .then((response) => {
                embedDashboard(response.data.EmbedUrl);;
            })
            .catch(function (error) {
                console.log('Error obtaining QuickSight dashboard embed url.', error);
            });
    }
});
