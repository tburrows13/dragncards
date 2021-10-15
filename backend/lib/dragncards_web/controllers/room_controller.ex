defmodule DragnCardsWeb.RoomController do
  use DragnCardsWeb, :controller

  alias DragnCards.Rooms
  alias DragnCards.Rooms.Room

  # alias DragnCardsUtil.{NameGenerator, Slugify}
  # alias DragnCardsGame.GameSupervisor

  action_fallback DragnCardsWeb.FallbackController

  def index(conn, _params) do
    rooms = Rooms.list_rooms()
    IO.inspect(rooms)
    render(conn, "index.json", rooms: rooms)
  end

  # Create: Removed, users no longer able to create rooms by API
  # Possibly this entire controller should be removed

  def show(conn, %{"id" => id}) do
    room = Rooms.get_room!(id)
    render(conn, "show.json", room: room)
  end

  def update(conn, %{"id" => id, "room" => room_params}) do
    room = Rooms.get_room!(id)

    with {:ok, %Room{} = room} <- Rooms.update_room(room, room_params) do
      render(conn, "show.json", room: room)
    end
  end

  def delete(conn, %{"id" => id}) do
    room = Rooms.get_room!(id)

    with {:ok, %Room{}} <- Rooms.delete_room(room) do
      send_resp(conn, :no_content, "")
    end
  end
end
