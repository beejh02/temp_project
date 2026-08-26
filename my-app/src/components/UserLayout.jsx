import { NavLink, Outlet } from "react-router-dom";
import "./UserLayout.css";

const navigationItems = [
  {
    to: "/",
    label: "지도",
    end: true,
    icon: (
      <>
        <path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z" />
        <path d="M9 4v14M15 6v14" />
      </>
    ),
  },
  {
    to: "/missions",
    label: "미션",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 4V2M20 12h2M12 20v2M4 12H2" />
      </>
    ),
  },
  {
    to: "/mypage",
    label: "마이",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6" />
      </>
    ),
  },
];

function UserLayout() {
  return (
    <div className="user-layout">
      <header className="user-navigation">
        <NavLink className="user-navigation__brand" to="/" aria-label="누리고 지도 홈">
          <span aria-hidden="true">누</span>
          <strong>누리고</strong>
        </NavLink>

        <nav className="user-navigation__menu" aria-label="주요 메뉴">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `user-navigation__item${isActive ? " is-active" : ""}`
              }
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {item.icon}
              </svg>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <span className="user-navigation__spacer" aria-hidden="true" />
      </header>

      <main className="user-layout__content">
        <Outlet />
      </main>
    </div>
  );
}

export default UserLayout;
