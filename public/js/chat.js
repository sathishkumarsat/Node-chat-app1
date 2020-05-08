//The return value from io() fn needs to be stored
const socket = io();


//Creating variables for elements prefixed with $ sign(convention for dom elements to know what in there n easier to parse but optional)
const $messageForm = document.querySelector('#message-form'); //Form
const $messageFormInput = document.querySelector('input'); //input
const $messageFormButton = document.querySelector('button'); //send button
const $sendLocationButton = document.querySelector('#send-location');//send location button

//In order to render template we need template n access to the place where we want display msg

//Place where msg need to be displayed
const $messages = document.querySelector('#messages');


//Templates storing in a variable

//In which template/view we want to show our message
const messageTemplate = document.querySelector('#message-template').innerHTML;

//In which template/view we want to show our location
const locationTemplate = document.querySelector('#location-template').innerHTML;

//In which template/view we want to show users belongs to room
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
//Here we use qs.js(query string) library
//Need to seperate query string (Ex: "?username=sathishksk&room=south") in to username n room
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });//Destructuring used to store seperately
//ignoreQueryPrefix - is to remove '?' in qs

//We need to add autoscroll every time we render new text n location msgs
//Create a autoscroll fn, n use/call it in both just after rendering msgs
autoscroll = () => {
    //Get new message element, so we can find the height of the new message, so based on its postion we activate scroll
    const $newMessage = $messages.lastElementChild;//lastElementChild retruns last/bottom/new message from all $messages

    //To get height, we may use hardcoded(height) values from css but incase if we change styles in future that might be a problem
    //Now get the height of last/new message using below steps
    const newMessageStyles = getComputedStyle($newMessage);//So we can get whatever styles we used in css for this element with help of browser 
    //console.log(newMessageStyles);//(pic)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);//It returns number, so use parseInt() incase
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;//(previous/visible height + new msg height)

    //Now get visible height(regardless of how many msgs we can see only msgs within visible height)
    const visibleHeight = $newMessage.offsetHeight;

    //Get height of all msgs container(the height occupied by all msgs)
    const containerHeight = $newMessage.scrollHeight;

    //Get how far down we scrolled(Amount of distance we scrolled from the top)
    //scrollTop - At top it returns '0', as we scroll it increases

    //To know how far from bottom = distance b/w top of content&top of scrollbar(scrollTop)+scrollbar height(visible height)
    const scrollOffset = $newMessage.scrollTop + visibleHeight;

    //Case1: If we want always scroll to the bottom use below statement
    //$messages.scrollTop = $messages.scrollHeight;

    //Case2: If we want to scroll manually to the top, put above statement in  below conditional statement
    //Below condition is to, while we are getting msgs it will auto scroll to bottom, 
    //after some msgs, if we manually scroll to top, again if new msg comes it won't scroll down, we need to scroll manually to see new msg
    if (containerHeight - newMessageHeight <= scrollOffset) {
        //If substract last msg height from total container height 
        //scrolled to the bottom before new msg added
        //Make sure we are at bottom before last msg was added 
        $messages.scrollTop = $messages.scrollHeight;//we are setting the height
    }

}

//Listener for messageUpdated
socket.on('messageUpdated', (message) => {
    console.log(message);
    //Now message is obj
    const html = Mustache.render(messageTemplate, {//here we assign msg to template
        username: message.username,
        message: message.text,
        //Use moment.js to format date
        createdAt: moment(message.createdAt).format('h:mm a')
    });

    //Here we assign template to div (place of display)
    $messages.insertAdjacentHTML('beforeend', html);

    autoscroll();//calling after render msg
});


//Listener for locationMessage 
socket.on('locationMessage', (location) => {
    console.log(location);//We can see in dev tools

    const html = Mustache.render(locationTemplate, {
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    });

    $messages.insertAdjacentHTML('beforeend', html);

    autoscroll();//calling after render msg
});


//listen to the roomData event
socket.on('roomData', ({ room, users }) => {//Destructring
    //console.log(room);
    //console.log(users);
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });

    //Here we want to show
    document.querySelector('#sidebar').innerHTML = html;
});





//listen to the form data
$messageForm.addEventListener('submit', (e) => {  //replaced with variable
    e.preventDefault();

    //Once message sent or once send button clicked, disable the submit button
    $messageFormButton.setAttribute('disabled', 'disabled');//(attr, value)
    //.setAttribute - To set attributes on html elements

    const message = e.target.elements.message.value;

    //Once we receive acknowledgement of msg success, then again enable button to send next msg
    socket.emit('sendMessage', message, (error) => {

        $messageFormButton.removeAttribute('disabled');//Enabling button regardless of error
        $messageFormInput.focus();//Auto-focus 

        if (error) {
            return console.log(error);
        }

        console.log('The message was delivered');
        $messageFormInput.value = '';//Clear input data
    })
});


//Listen to the button click, to send location
$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Browser is not supporting Geolocation');
    }

    $sendLocationButton.setAttribute('disabled', 'disabled');//Button disabled once clicked

    //To fetch the location
    navigator.geolocation.getCurrentPosition((position) => {
        const locationData = { latitude: position.coords.latitude, longitude: position.coords.longitude };

        //sending location to server
        socket.emit('sendLocation', locationData, (acknowledge) => {

            $sendLocationButton.removeAttribute('disabled');//Button enabled after acknowledgement received
            console.log(acknowledge);
        });
    });
});


//Emit event to server n accepts username n room
//If any error sent by server, then declare callback/fn as 3rd arg when server acknowledges(only for error, bcz if successful - user knows) 
socket.emit('join', { username, room }, (error) => {
    if (error) {//if callback error received show error msg n redirect them back to login/home page
        alert(error);
        location.href = '/';//redirect to root of the site
    }
});


