$(document).ready(function() {
	var width = $(document).width();
	var height = $(document).height() - 70;
	
	var visualization = new Visualization(width, height, "mynetwork", projectid);
});