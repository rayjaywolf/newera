import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center">
            <SignUp
                appearance={{
                    elements: {
                        formButtonPrimary:
                            "bg-primary text-primary-foreground hover:bg-primary/90",
                        footerActionLink:
                            "text-primary hover:text-primary/90",
                        card: "bg-white/[0.34] shadow-none border border-[rgba(0,0,0,0.08)]",
                    },
                }}
                signInUrl="/sign-in"
                fallbackRedirectUrl='/new-user'
            />
        </div>
    );
}
