function newAlias(command, el) {
    el.parentNode.insertAdjacentHTML('beforebegin',`<div class="input"><input class="alias" type="text" name="${command}.aliases" value="${el.parentNode.firstChild.value}" data-lpignore="true"><input class="button" type="button" value="x" onclick="this.parentNode.remove()"></div>`);
    el.parentNode.firstChild.value = "";
}

function newPerm(command, el) {
    el.parentNode.insertAdjacentHTML('beforebegin',`<div class="input" style="${el.parentNode.style.cssText}"><input class="perm" type="text" name="${command}.perms" value="${el.parentNode.firstChild.value}" style="${el.parentNode.firstChild.style.cssText}" list="roles" onkeyup="changeColor(this)" onchange="changeColor(this)" onpaste="changeColor(this)" data-lpignore="true"><input class="button" type="button" value="x" onclick="this.parentNode.remove()"></div>`);
    el.parentNode.firstChild.value = "";
    el.parentNode.firstChild.style = null;
    el.parentNode.style = null;
}
window.addEventListener("resize", () => {
    document.getElementsByClassName("pluginContent")[0].style.height = `${window.innerHeight - document.getElementsByClassName("saveBar")[0].offsetHeight - document.getElementsByClassName("topbar")[0].offsetHeight - document.getElementsByClassName("footer")[0].offsetHeight}px`;
});

const rolelist = {"": "rgb(0, 0, 0)"}
Array.from(roles.options).forEach(role => {
    rolelist[role.innerText] = role.style.color;
});

function changeColor(el) {
    if (rolelist[el.value]) {
        el.style.color = rolelist[el.value];
        el.parentNode.style.border = "1px solid green";
    }
    else {
        el.style.color = "rgb(0, 0, 0)";
        el.parentNode.style.border = "1px solid red";
    }
}
