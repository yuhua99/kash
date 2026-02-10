import { validatePassword, validateUsername } from '$lib/validation';

interface HandleAuthSubmitOptions {
	event: SubmitEvent;
	username: string;
	password: string;
	onValidSubmit: (normalizedUsername: string, password: string) => Promise<void>;
	setUsernameError: (message: string) => void;
	setPasswordError: (message: string) => void;
	setFormError: (message: string) => void;
	setPending: (value: boolean) => void;
	fallbackErrorMessage: string;
}

export async function handleAuthSubmit(options: HandleAuthSubmitOptions): Promise<void> {
	const {
		event,
		username,
		password,
		onValidSubmit,
		setUsernameError,
		setPasswordError,
		setFormError,
		setPending,
		fallbackErrorMessage
	} = options;

	event.preventDefault();
	setUsernameError('');
	setPasswordError('');
	setFormError('');

	const normalizedUsername = username.trim();
	const usernameError = validateUsername(normalizedUsername) ?? '';
	const passwordError = validatePassword(password) ?? '';

	if (usernameError || passwordError) {
		setUsernameError(usernameError);
		setPasswordError(passwordError);
		return;
	}

	setPending(true);
	try {
		await onValidSubmit(normalizedUsername, password);
	} catch (error) {
		setFormError(error instanceof Error ? error.message : fallbackErrorMessage);
	} finally {
		setPending(false);
	}
}
