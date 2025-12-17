import DropdownList, { OptionType } from "../DropdownList";
import FeedbackFormTriggerIcon from "../assets/asi-feedback-logo.png";
import { useState, ReactElement, ChangeEvent } from "react";
import {
    endpoints,
    FEEDBACK_FORM_SOURCE,
    SUCCESS_SCREEN_TIMEOUT,
    MINIMUM_FEEDBACK_TEXT_LENGTH,
} from "./meta";
import "./style.css";

enum FeedbackCategory {
    QUESTION = "question",
    BUG = "bug",
    FEEDBACK = "feedback",
}

type TFormFields = {
    name: string;
    email: string;
    feedback: string;
    category: FeedbackCategory;
};

const EMAIL_VALIDATION_REGEX =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const initialFormFields: TFormFields = {
    name: "",
    email: "",
    feedback: "",
    category: FeedbackCategory.QUESTION,
};

const FeedbackForm = (): ReactElement => {
    const [isRequestHandling, setIsRequestHandling] = useState(false);
    const [isRequestSent, setIsRequestSent] = useState(false);
    const [isFormDisplayed, setIsFormDisplayed] = useState(false);
    const [formFields, setFormFields] =
        useState<TFormFields>(initialFormFields);

    const options: OptionType[] = [
        { value: FeedbackCategory.QUESTION, title: "Question" },
        { value: FeedbackCategory.BUG, title: "Bug" },
        { value: FeedbackCategory.FEEDBACK, title: "Feedback" },
    ];

    const isEmailValid = (value: string): boolean =>
        EMAIL_VALIDATION_REGEX.test(value);

    const isSubmitAvailable =
        !!formFields.name &&
        isEmailValid(formFields.email) &&
        !!formFields.feedback &&
        formFields.feedback?.trim()?.length >= MINIMUM_FEEDBACK_TEXT_LENGTH &&
        !!formFields.category;

    const toggleFormVisibility = () => {
        setIsFormDisplayed((prev) => !prev);
    };

    const handleInputChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = event.target;

        setFormFields((prev) => ({ ...prev, [name]: value }));
    };

    const selectCategory = (option: OptionType) => {
        setFormFields((prev) => ({
            ...prev,
            category: option.value as FeedbackCategory,
        }));
    };

    const resetForm = () => {
        setFormFields(initialFormFields);
    };

    const showAlert = async () => {
        setIsRequestSent(true);

        await new Promise((resolve) =>
            setTimeout(resolve, SUCCESS_SCREEN_TIMEOUT)
        );

        setIsRequestSent(false);
    };

    const sendFeedback = async () => {
        if (isRequestHandling) {
            return;
        }

        try {
            setIsRequestHandling(true);

            const response = await fetch(endpoints.FEEDBACK, {
                method: "POST",
                mode: "cors",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                    source: FEEDBACK_FORM_SOURCE,
                    name: formFields.name,
                    address: "",
                    email: formFields.email,
                    phone_no: "",
                    message_type: formFields.category,
                    subject: "",
                    message: formFields.feedback,
                    attachment_details: {},
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send feedback");
            }

            setIsFormDisplayed(false);

            await showAlert();
        } catch (error) {
            console.error("Error on feedback request:", error);

            setIsFormDisplayed(false);
        } finally {
            resetForm();

            setIsRequestHandling(false);
        }
    };

    return (
        <div className="feedback-form-holder">
            <div
                className={`feedback-form ${!isFormDisplayed ? "hidden" : ""}`}
            >
                <div className="form-header">
                    <h2>Feedback form</h2>
                    <button onClick={toggleFormVisibility} type="button">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            id="close-icon"
                            height="15px"
                            width="15px"
                            viewBox="0 0 20 20"
                        >
                            <line
                                x1="0"
                                y1="0"
                                x2="20"
                                y2="20"
                                stroke="currentColor"
                                strokeLinecap="round"
                            />
                            <line
                                x1="0"
                                y1="20"
                                x2="20"
                                y2="0"
                                stroke="currentColor"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>
                <form>
                    <fieldset>
                        <div className="form-field">
                            <label htmlFor="category">Support category</label>
                            <DropdownList
                                options={options}
                                onSelect={selectCategory}
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="name">Name</label>
                            <input
                                id="name"
                                name="name"
                                value={formFields.name}
                                onChange={handleInputChange}
                                placeholder="Enter your name"
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                value={formFields.email}
                                onChange={handleInputChange}
                                className={
                                    formFields.email &&
                                    !isEmailValid(formFields.email)
                                        ? "error-field"
                                        : ""
                                }
                                placeholder="Enter your email"
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="feedback">Your text</label>
                            <textarea
                                id="feedback"
                                name="feedback"
                                value={formFields.feedback}
                                onChange={handleInputChange}
                                placeholder="Enter your text"
                            />
                        </div>
                    </fieldset>
                    <div
                        className={`submit-btn-container ${
                            isSubmitAvailable ? "gradient-border" : ""
                        }`}
                    >
                        <button
                            className="submit-button"
                            type="button"
                            disabled={!isSubmitAvailable || isRequestHandling}
                            onClick={sendFeedback}
                        >
                            {isRequestHandling ? (
                                <span>Loading...</span>
                            ) : (
                                <span>Submit</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <div className={`ready-alert ${!isRequestSent ? "hidden" : ""}`}>
                Thank you! Our technical support will get in touch with you
                soon!
            </div>
            <div
                className={`feedback-form-launcher ${
                    isFormDisplayed ? "hidden" : ""
                }`}
            >
                <button onClick={toggleFormVisibility} type="button">
                    <img src={FeedbackFormTriggerIcon} alt="feedback" />
                </button>
            </div>
        </div>
    );
};

export default FeedbackForm;
