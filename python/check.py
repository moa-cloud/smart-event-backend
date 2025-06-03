from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017/')
db = client['users']
interactions = db.interactions.find()
event_ids = set(str(e['_id']) for e in db.events.find())
user_ids = set(str(u['_id']) for u in db.users.find())
print("MongoDB Interactions:")
for interaction in interactions:
    user_id = str(interaction['userId'])
    event_id = str(interaction['eventId'])
    user_valid = user_id in user_ids
    event_valid = event_id in event_ids
    print(f"User ID: {user_id}, Valid: {user_valid}, Event ID: {event_id}, Valid: {event_valid}")
client.close()