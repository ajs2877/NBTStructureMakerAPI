var handleError = (message) => { 
    $("#errorMessage").text(message); 
}; 

var redirect = (response) => { 
    window.location = response.redirect; 
}; 

var sendAjax = (type, action, data, success) => { 
    $.ajax({ 
        cache: false, 
        type: type, 
        url: action,
        data: data, 
        dataType: "json", 
        success: success, 
        error: function(xhr, status, error) { 
            let messageObj = JSON.parse(xhr.responseText); 
            handleError(messageObj.error); 
        } 
    }); 
}; 
