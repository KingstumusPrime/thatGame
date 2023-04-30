var input = document.querySelector("#chat-input");
var output = document.querySelector("#chat-output");
var chatForm = document.querySelector("#chat")
var PUBNUB_demo = PUBNUB.init({
    publish_key: 'pub-c-70b97e50-bb4e-443a-af5a-5e55694d00f5',
    subscribe_key: 'sub-c-dd3d51f7-cc74-4c2f-a555-03e9fa97f254'
});
var pubnub = PUBNUB.init({
    publish_key: 'demo',
    subscribe_key: 'demo'
  });

var channel = 'main-lobby-demo';


function handleForm(event) { event.preventDefault(); } 
chatForm.addEventListener('submit', handleForm);
chatForm.addEventListener("submit", (e)=> {
    console.log(input.value)
     // publish input value to channel 
    pubnub.publish({
        channel: channel,
        message: input.value
    });

    // clear the input field
    input.value = "";

    // cancel event bubbling
    return false;
})


// when we receive messages
pubnub.subscribe({
    channel: channel, // our channel name
    message: function(text) { // this gets fired when a message comes in
  

      output.innerHTML += `<li><span>${text}</span></li>`;
  
    }
  });