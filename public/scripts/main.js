$(document).ready(function() {
	$('.submit').click(function() {
		$('.f1').submit();
	});
	$('.r_btn_text').click(function() {
		$('.f2').submit();
	});
	$('.submit_btn').click(function() {
		$('.f3').submit();
	});
	$('.edit').click(function() {
		$('#e_form').submit();
	});
	$('.delete').click(function() {
		$('#d_form').submit();
	});
});