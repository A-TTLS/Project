import { useState } from "react";
import ActivityPage from "./pages/ActivityPage";
import DashboardPreview from "./pages/DashboardPreview";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import MeasurementsPage from "./pages/MeasurementsPage";
import RegisterPage from "./pages/RegisterPage";
import type { ActivityLevel, UserMeasurements, UserProfile } from "./services/authService";

type Page = "landing" | "login" | "register" | "measurements" | "activity" | "dashboard";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const [user, setUser] = useState<UserProfile | null>(null);

  // Clean empty inputs - no hardcoded mock student data
  const [measurements, setMeasurements] = useState<UserMeasurements>({
    gender: "Female",
    age: "",
    height: "",
    weight: "",
    target: "",
    units: "metric",
  });

  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");

  switch (currentPage) {
    case "landing":
      return (
        <LandingPage
          onNavigate={(page) => setCurrentPage(page)}
        />
      );

    case "login":
      return (
        <LoginPage
          onGoBack={() => setCurrentPage("landing")}
          onGoToRegister={() => setCurrentPage("register")}
          onSignedIn={(email) => {
            setUser({ name: email.split("@")[0], username: `@${email.split("@")[0]}`, email });
            setCurrentPage("dashboard");
          }}
        />
      );

    case "register":
      return (
        <RegisterPage
          onCreated={(newUser) => {
            setUser(newUser);
            setCurrentPage("measurements");
          }}
          onGoBack={() => setCurrentPage("landing")}
          onGoToLogin={() => setCurrentPage("login")}
        />
      );

    case "measurements":
      return (
        <MeasurementsPage
          initialValues={measurements}
          onBack={() => setCurrentPage("register")}
          onChange={setMeasurements}
          onContinue={() => setCurrentPage("activity")}
        />
      );

    case "activity":
      return (
        <ActivityPage
          level={activityLevel}
          measurements={measurements}
          onBack={() => setCurrentPage("measurements")}
          onComplete={() => setCurrentPage("dashboard")}
          onLevelChange={setActivityLevel}
        />
      );

    case "dashboard":
      return (
        <DashboardPreview
          activity={activityLevel}
          measurements={measurements}
          onSignOut={() => {
            setUser(null);
            setCurrentPage("landing");
          }}
          user={user}
        />
      );

    default:
      return (
        <LandingPage
          onNavigate={(page) => setCurrentPage(page)}
        />
      );
  }
}
