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
	$('.scroll').jScrollPane();
	$('.scroll_item').jScrollPane();
	$('.f2').validate({
		rules: {
			login: {
				required: true,
				minlength: 2
			},
			name: {
				required: true,
				minlength: 2
			},
			password: {
				required: true,
				minlength: 5
			},
			skype: {
				required: true,
				minlength: 2
			},
			email: {
				required: true,
				email: true
			},
		},
		messages: {
			login: {
				required: "Введите имя пользователя",
				minlength: "Не менее 2 символов"
			},
			name: {
				required: "Введите имя",
				minlength: "Не менее 2 символов"
			},
			password: {
				required: "Введите пароль",
				minlength: "Не менее 5 символов"
			},
			email: "Введите правильный email",
			skype: {
				required: "Введите имя в Skype",
				minlength: "Не менее 2 символов"
			}
		}
	});
});