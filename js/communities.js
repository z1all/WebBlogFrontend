import { loadPageWithoutReload, saveInitFuncAndRun } from './tools/loadMainContent.js';
import { userIsAuthorized, userIsNotAuthorized } from './index.js';
import { RequestInfo, request, multipleRequest } from './tools/request.js';
import { ADMINISTRATOR, SUBSCRIBER } from './tools/constants.js';

const tempCommunity = getTemp($('#temp_community_id'));

function init() {
    getCommunities();
}

function getCommunities () {
    let container = $('#communities_container_id');

    if (window.myApp.tokenVerificationResult) {
        const loadCommunities = (data) => {
            console.log("communities get auth", data);
    
            container.empty();
            if (data.status[0] === 200 && data.status[1] === 200) {
                insertCommunities(container, data.body[0], data.body[1]);
            }
            else if (data.status[1] === 401) {
                userIsNotAuthorized();
                loadPageFromCurrentUrl();
                return;
            }
        }
    
        multipleRequest(
            new RequestInfo('https://blog.kreosoft.space/api/community', 'GET'), 
            new RequestInfo('https://blog.kreosoft.space/api/community/my', 'GET', null, localStorage.getItem('JWTToken')), 
            loadCommunities
        );
    }
    else {
        const loadCommunities = (data) => {
            console.log("communities get", data);
            
            container.empty();
            if (data.status === 200) {
                insertCommunities(container, data.body);
            }
            else {
                container.text("Произошла ошибка");
            }
        }
    
        request('https://blog.kreosoft.space/api/community', 'GET', loadCommunities);
    }
}

function insertCommunities (container, communities, subscripbes = null) {
    Array.from(communities).forEach(community => {
        let tempCommunityCloned = tempCommunity.clone();

        tempCommunityCloned.children().first().text(community.name);

        if (subscripbes) {
            let subscripbe = subscripbes.find(subscripbe => community.id === subscripbe.communityId);
            let subscripbeButton = tempCommunityCloned.children().eq(1);
            let unsubscripbeButton = tempCommunityCloned.children().eq(2);

            setSubscripbeListeners(subscripbeButton, unsubscripbeButton, community.id);

            if (!subscripbe) {
                subscripbeButton.removeClass('d-none');
            }
            else if (subscripbe.role === SUBSCRIBER) { 
                unsubscripbeButton.removeClass('d-none');
            } 
        }

        tempCommunityCloned.appendTo(container);
    });
}

function setSubscripbeListeners (subscripbeButton, unsubscripbeButton, communityId) {
    subscripbeButton.on('click', function () {
        $(this).prop('disabled', true);
        changeSubscripbe(subscripbeButton, unsubscripbeButton, communityId, true);
    });

    unsubscripbeButton.on('click', function () {
        $(this).prop('disabled', true);
        changeSubscripbe(subscripbeButton, unsubscripbeButton, communityId, false);
    });
}

function changeSubscripbe (subscripbeButton, unsubscripbeButton, communityId, isSubscripbe) {
    let token = localStorage.getItem('JWTToken');

    const changeSub = (data, isSet) => {
        console.log("Subscripbe change, isSet:", isSet, data);
        
        if (data.status === 200) {
            swapSubscripbeButton(subscripbeButton, unsubscripbeButton, isSet);
        }
        else if (data.status === 401) {
            userIsNotAuthorized();
            loadPageFromCurrentUrl();
            return;
        }

        $(subscripbeButton).prop('disabled', false);
        $(unsubscripbeButton).prop('disabled', false);
    }
    
    if (isSubscripbe) {
        request('https://blog.kreosoft.space/api/community/' + communityId + '/subscribe', 'POST', (data) => changeSub(data, true), null, token);
    }
    else {
        request('https://blog.kreosoft.space/api/community/' + communityId + '/unsubscribe', 'DELETE', (data) => changeSub(data, false), null, token);
    }
}

function swapSubscripbeButton (subscripbeButton, unsubscripbeButton, wasSet) {
    if (wasSet) {
        $(subscripbeButton).addClass('d-none');
        $(unsubscripbeButton).removeClass('d-none');
    }
    else {
        $(subscripbeButton).removeClass('d-none');
        $(unsubscripbeButton).addClass('d-none');
    }
}

function getTemp (element) {
    let cloned = element.clone();
    cloned.removeClass('d-none');
    cloned.removeAttr('id');
    element.remove();

    return cloned;
}

saveInitFuncAndRun(init);