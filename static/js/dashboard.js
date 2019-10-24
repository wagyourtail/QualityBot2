function newAlias(command, el) {
    el.parentNode.insertAdjacentHTML('beforebegin',`<div class="input"><input class="alias" type="text" name="${command}.aliases" value="${el.parentNode.firstChild.value}" data-lpignore="true"><input class="button" type="button" value="x" onclick="this.parentNode.remove()"></div>`);
    el.parentNode.firstChild.value = "";
}

function newPerm(command, el) {
    el.parentNode.insertAdjacentHTML('beforebegin',`<div class="input"><input class="perm" type="text" name="${command}.perms" value="${el.parentNode.firstChild.value}" list="roles" data-lpignore="true"><input class="button" type="button" value="x" onclick="this.parentNode.remove()"></div>`);
    el.parentNode.firstChild.value = "";
}
window.addEventListener("resize", () => {
    document.getElementsByClassName("pluginContent")[0].style.height = `${window.innerHeight - document.getElementsByClassName("saveBar")[0].offsetHeight - document.getElementsByClassName("topbar")[0].offsetHeight - document.getElementsByClassName("footer")[0].offsetHeight}px`;
});
