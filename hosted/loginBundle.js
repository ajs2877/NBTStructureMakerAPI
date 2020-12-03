let handleLogin = e => {
  e.preventDefault();

  if ($("#user").val() == '' || $("#pass").val() == '') {
    handleError("Username or password is empty");
    return false;
  }

  console.log($("input[name=_csrf]").val());
  sendAjax('POST', $("#loginForm").attr("action"), $("#loginForm").serialize(), redirect);
  return false;
};

let handleSignup = e => {
  e.preventDefault();

  if ($("#user").val() == '' || $("#pass").val() == '' || $("#pass2").val() == '') {
    handleError("All fields are required");
    return false;
  }

  if ($("#pass").val() !== $("#pass2").val()) {
    handleError("Passwords do not match");
    return false;
  }

  sendAjax('POST', $("#signupForm").attr("action"), $("#signupForm").serialize(), redirect);
  return false;
};

let LoginWindow = props => {
  return /*#__PURE__*/React.createElement("form", {
    id: "loginForm",
    name: "loginForm",
    onSubmit: handleLogin,
    action: "/login",
    method: "POST",
    className: "mainForm"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: "username"
  }, "Username: "), /*#__PURE__*/React.createElement("input", {
    id: "user",
    type: "text",
    name: "username",
    placeholder: "username"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: "pass"
  }, "Password: "), /*#__PURE__*/React.createElement("input", {
    id: "pass",
    type: "password",
    name: "pass",
    placeholder: "password"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
    type: "hidden",
    name: "_csrf",
    value: props.csrf
  }), /*#__PURE__*/React.createElement("input", {
    className: "formSubmit",
    type: "submit",
    value: "Sign in"
  })));
};

let SignupWindow = props => {
  return /*#__PURE__*/React.createElement("form", {
    id: "signupForm",
    name: "signupForm",
    onSubmit: handleSignup,
    action: "/signup",
    method: "POST",
    className: "mainForm"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: "username"
  }, "Username: "), /*#__PURE__*/React.createElement("input", {
    id: "user",
    type: "text",
    name: "username",
    placeholder: "username"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: "pass"
  }, "Password: "), /*#__PURE__*/React.createElement("input", {
    id: "pass",
    type: "password",
    name: "pass",
    placeholder: "password"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: "pass2"
  }, "Password: "), /*#__PURE__*/React.createElement("input", {
    id: "pass2",
    type: "password",
    name: "pass2",
    placeholder: "retype password"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
    type: "hidden",
    name: "_csrf",
    value: props.csrf
  }), /*#__PURE__*/React.createElement("input", {
    className: "formSubmit",
    type: "submit",
    value: "Sign in"
  })));
};

let createLoginWindow = csrf => {
  ReactDOM.render( /*#__PURE__*/React.createElement(LoginWindow, {
    csrf: csrf
  }), document.querySelector("#content"));
};

let createSignupWindow = csrf => {
  ReactDOM.render( /*#__PURE__*/React.createElement(SignupWindow, {
    csrf: csrf
  }), document.querySelector("#content"));
};

let setup = csrf => {
  let loginButton = document.querySelector("#loginButton");
  let signupButton = document.querySelector("#signupButton");
  signupButton.addEventListener("click", e => {
    e.preventDefault();
    createSignupWindow(csrf);
    loginButton.style.display = "inline-block";
    signupButton.style.display = "none";
    return false;
  });
  loginButton.addEventListener("click", e => {
    e.preventDefault();
    createLoginWindow(csrf);
    loginButton.style.display = "none";
    signupButton.style.display = "inline-block";
    return false;
  });
  createLoginWindow(csrf); //default view 
};

let getToken = () => {
  sendAjax('GET', '/getToken', null, result => {
    setup(result.csrfToken);
  });
};

$(document).ready(function () {
  getToken();
});
let handleError = message => {
  $("#errorMessage").text(message);
  alert(message);
};

let redirect = response => {
  window.location = response.redirect;
};

let sendAjax = (type, action, data, success) => {
  $.ajax({
    cache: false,
    type: type,
    url: action,
    data: data,
    dataType: "json",
    success: success,
    error: function (xhr, status, error) {
      let messageObj = JSON.parse(xhr.responseText);
      handleError(messageObj.error);
    }
  });
};
/**
 * helper method to make XHR requests
 */
const createXHR = (info, headersObject, callback) => {
  const xhr = new XMLHttpRequest();
  xhr.open(info['method'], info['action']);

  if (headersObject != null) {
    Object.keys(headersObject).forEach(key => {
      xhr.setRequestHeader(key, headersObject[key]);
    });
  }

  xhr.onload = () => callback(xhr, true);

  return xhr;
};
