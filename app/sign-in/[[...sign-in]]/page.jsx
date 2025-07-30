import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/quizSpark_icon.png"
              alt="Quiz Spark"
              width={80}
              height={80}
              className="rounded-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Quiz Spark
          </h1>
          <p className="text-gray-600">
            Sign in to access your quizzes and learning dashboard
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-yellow-500 hover:bg-yellow-600 text-black font-medium",
                card: "shadow-none",
                headerTitle: "text-gray-900",
                headerSubtitle: "text-gray-600",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
} 