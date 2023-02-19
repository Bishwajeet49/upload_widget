function _(element) {
  return document.querySelector(element);
}

/*generate unique id for each new request
this unique id will be used to keep track for each ui 
element related to particular request*/
function* idGenerator() {
  let count = -1;
  while (true) yield ++count;
}

let generatorObj = idGenerator();

_(".row").addEventListener("click", () => {
  let input = document.createElement("input");
  input.type = "file";
  input.setAttribute("multiple", true);
  input.onchange = (e) => {
    const fileList = input.files;
    for (const file of fileList) {
      if (fileList.size === 0) continue;
      /*
           
    here we can apply different validations on each selected file 
    by using different property of file obj like file.
    file.type
    file.size e.t.c 

    */
      let requestId = generatorObj.next().value;
      createProgressTrackers(file, requestId); //create ui elements for each request
      sendRequest(file, requestId); //use to send unique request for each file
    }
  };
  input.click();
});

/*storing the color for custom file icons in an object so that system 
can search the color related to uploaded file in constant time 
 and if that icon not present than in this case show the default icon*/

const fileIconsColors = {
  ai: "#ff5e00",
  avi: "#06c941",
  doc: "#ddf315",
  gif: "#c715f3",
  jpg: "#f3158f",
  mkv: "#c90661",
  mp3: "#15f3bb",
  mp4: "#15f34c",
  pdf: "#15b4f3",
  ppt: "#1549f3",
  exe: "#f462fe",
  log: "#fefefe",
  psd: "#7515f3",
  png: "#7613f3",
  svg: "#f36615 ",
  txt: "#f3a515",
  xls: "#b0f315",
  zip: "#4c0391",
  default: "#f31515",
};

function createProgressTrackers(file, requestId) {
  //finding the extension of file through file name
  let fileExt = file.name
    .split(".")
    .slice(-1)
    .join()
    .substring(0, 3)
    .toUpperCase();

  // Create the main task wrapper element
  const taskWrapper = document.createElement("div");
  taskWrapper.classList.add("task_wrapper");

  // Create the file icon container element and append it to the task wrapper
  const fileIconContainer = document.createElement("div");
  fileIconContainer.classList.add("file_icon_container");
  taskWrapper.appendChild(fileIconContainer);

  // Create the file icon wrapper element and append it to the file icon container
  const fileIconWrapper = document.createElement("div");
  fileIconWrapper.classList.add("file_icon_wrapper");
  fileIconContainer.appendChild(fileIconWrapper);

  // Create the image element and set its source to the provided icon name, and append it to the file icon wrapper
  const box1 = document.createElement("div");
  box1.classList.add("box_1");
  //   image.setAttribute("src", `files_icon/${fileExt}.png`);
  box1.classList.add("box_1");

  const extName = document.createElement("div");
  extName.classList.add("ext_name");
  extName.textContent = fileExt;
  box1.appendChild(extName);

  const triangle = document.createElement("div");
  triangle.classList.add("triangle");
  box1.appendChild(triangle);

  fileIconWrapper.appendChild(box1);

  /*coloring the file icons*/
  let color = fileIconsColors[fileExt.toLowerCase()];
  color = color ?? fileIconsColors.default;
  box1.style.border = `2px solid ${color}`;
  extName.style.backgroundColor = color;
  triangle.style.backgroundColor = color;

  const fileInfoWrapper = document.createElement("div");
  fileInfoWrapper.classList.add("file_info_wrapper");
  taskWrapper.appendChild(fileInfoWrapper);

  const fileName = document.createElement("div");
  fileName.classList.add("file_name");
  fileName.textContent = file.name;
  fileInfoWrapper.appendChild(fileName);

  const uploadingInfoTxt = document.createElement("div");
  uploadingInfoTxt.classList.add("uploading_info_txt");
  uploadingInfoTxt.textContent = "";
  uploadingInfoTxt.id = "icon_id" + requestId;
  fileInfoWrapper.appendChild(uploadingInfoTxt);

  const progressContainer = document.createElement("div");
  progressContainer.classList.add("progress_container");
  taskWrapper.appendChild(progressContainer);

  const progressTrackerOuter = document.createElement("div");
  progressTrackerOuter.classList.add("progress_tracker_outer");
  progressTrackerOuter.id = "req" + requestId;
  progressContainer.appendChild(progressTrackerOuter);

  const innerCircle = document.createElement("div");
  innerCircle.classList.add("inner_circle");
  progressTrackerOuter.appendChild(innerCircle);

  const abortBtn = document.createElement("span");
  abortBtn.classList.add("material-symbols-outlined", "abort-btn");
  abortBtn.textContent = "close";
  abortBtn.onclick = function () {
    abort(requestId);
  };
  innerCircle.appendChild(abortBtn);

  const parentElement = document.querySelector(".task_container");
  parentElement.insertBefore(taskWrapper, parentElement.children[0]);
}

let requestList = [];
function sendRequest(file, requestId) {
  const formData = new FormData();
  formData.append("file", file, "myFile");
  let xhr = new XMLHttpRequest();
  xhr.responseType = "";

  xhr.onload = () => {
    //change the logo to completed sign
    console.log(xhr.response);
    //fake code to simulate reciving actual response
    removeLoader(requestId);

    if (xhr.status === 200 || xhr.status === 201) {
      /*if response successfully received
      then stop the loader and change the icon
       color to show the successfully completion */
      removeLoader(requestId);
    }
  };
  xhr.upload.onprogress = (e) => {
    let { loaded, total } = e;
    let percent = Math.floor((loaded / total) * 100);

    //updating the circular loader to total uploaded data
    _("#req" + requestId).style.backgroundImage = `conic-gradient(
        #15f34c ${percent}%,
        rgba(228, 228, 228, 0.719) 0deg
      )`;

    if (percent === 100) {
      //if 100% data uploaded then waiting for response from the server
      //so  changing the progress tracker to loading mode
      changeProgressTracker(requestId);
    }

    //updating uploading info text
    _("#icon_id" + requestId).innerText = `${(loaded / 1024 / 1024).toFixed(
      2
    )} MB / ${(total / 1024 / 1024).toFixed(2)} MB (${percent}%)`;
  };

  xhr.open("post", "https://jsonplaceholder.typicode.com/posts", true);
  /*creating fake header so that response will be send from json place holder*/
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.send(formData);

  /*saving each xhr object ref. in the array so that user can abort it if they
  wish to do so*/
  requestList.push(xhr);
}

function abort(requestId) {
  let xhr = requestList[requestId];
  //checking if upload is already done or not
  if (xhr.readyState > 1) {
    alert(" opps! it's too late to cancel the upload");
    return;
  }
  xhr.abort();

  /*fetching how much percent data is uploaded through css property*/
  let conicGradientStr = _("#req" + requestId).style.backgroundImage;

  let endIndexOfSubStr = conicGradientStr.indexOf("%,");

  let startIndexOfSubStr = endIndexOfSubStr - 2;

  let uploadedPercentage = conicGradientStr.substring(
    startIndexOfSubStr,
    endIndexOfSubStr
  );

  //changing the color of conic-gradient to red for showing aborted request
  _("#req" + requestId).style.backgroundImage = `conic-gradient(
    rgb(236, 19, 19) ${uploadedPercentage}%,
    rgba(228, 228, 228, 0.719) 0deg
  )`;

  let iconElement = _("#req" + requestId).firstElementChild.firstElementChild;
  iconElement.className = "material-symbols-outlined uploadCancelIcon";
  iconElement.innerText = "file_upload_off";
}
function changeProgressTracker(requestId) {
  /*this loader will be activated only when the 100% data uploaded
    from the client side and client is waiting for the response from the 
    server */
  console.log("100% data uploaded");
  const progressTracker = _("#req" + requestId);
  //remove the conic gradient style
  progressTracker.style.backgroundImage = "";

  //add the loader class to progress tracker
  progressTracker.classList.add("loader");
  const childElement = progressTracker.firstElementChild;
  childElement.parentElement.removeChild(childElement);
}

function removeLoader(requestId) {
  /*this function invocation will cancel out the ui update of 
   changeProgressTracker function and modify the progress tracker
   to show the completion of task*/
  const progressTracker = _("#req" + requestId);
  progressTracker.classList.remove("loader");
  progressTracker.classList.add("responseSussesCircle");

  const span = document.createElement("span");
  span.className = "material-symbols-outlined doneIcon";
  span.appendChild(document.createTextNode("done"));
  progressTracker.appendChild(span);
}
