import { SignUp } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <SignUp
            appearance={{
                elements: {
                    formButtonPrimary:
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                    footerActionLink:
                        "text-primary hover:text-primary/90",
                },
            }}
            signInUrl="/sign-in"
            fallbackRedirectUrl='/new-user'
        />
    );
}
